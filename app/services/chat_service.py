"""Chat Service - AI-assisted guided ticket creation with controlled flow."""

import json
import os
import re
from typing import Optional

import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "mistral:7b")

MIN_QUESTIONS = 3
MAX_QUESTIONS = 5

CONVERSATION_SYSTEM_PROMPT = """You are an IT support intake assistant.
Rules:
1) Ask exactly one short clarifying question.
2) Keep question under 22 words.
3) Do not include JSON, code blocks, or markdown.
4) Ask only about missing details for ticket creation."""

EXTRACTION_SYSTEM_PROMPT = """Extract a ticket-intake JSON object from the conversation.
Return ONLY valid JSON with no markdown or extra text.

Schema:
{
  "summary": "short problem summary",
  "impact": "what is blocked/affected",
  "when_started": "time/start if known",
  "error_text": "exact error/symptoms if known",
  "attempted_fix": "what the user already tried",
  "urgency": "low|normal|high",
  "request_type": "software|hardware|environment|logistics|other"
}

If unknown, use empty string for text fields.
Infer urgency/request_type conservatively when possible."""

REQUIRED_FIELDS = ("summary", "impact", "when_started")

QUESTION_BY_FIELD = {
    "summary": "Can you describe exactly what is not working right now?",
    "impact": "How is this impacting your work right now?",
    "when_started": "When did this issue start?",
    "error_text": "Do you see an error message or specific symptom?",
    "attempted_fix": "What have you already tried so far?",
}


def _extract_json_blob(text: str) -> dict:
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return json.loads(text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise json.JSONDecodeError("No JSON object found", text, 0)
    return json.loads(match.group(0))


def _normalize_urgency(value: str) -> str:
    v = (value or "").strip().lower()
    if v in {"low", "normal", "high"}:
        return v
    return "normal"


def _normalize_request_type(value: str) -> str:
    v = (value or "").strip().lower()
    allowed = {"software", "hardware", "environment", "logistics", "other"}
    if v in allowed:
        return v
    return "other"


def count_assistant_questions(messages: list[dict]) -> int:
    """Count clarifying questions asked by assistant in chat history."""
    count = 0
    for msg in messages:
        if msg.get("role") != "assistant":
            continue
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        if content.startswith("Hi! I'm your IT support assistant."):
            continue
        if "?" in content:
            count += 1
    return count


def missing_fields(extracted: dict) -> list[str]:
    missing = [field for field in REQUIRED_FIELDS if not (extracted.get(field) or "").strip()]
    if not (extracted.get("error_text") or "").strip() and not (
        extracted.get("attempted_fix") or ""
    ).strip():
        missing.append("error_text")
    return missing


def should_create_ticket(extracted: dict, questions_asked: int) -> bool:
    if questions_asked < MIN_QUESTIONS:
        return False
    if not missing_fields(extracted):
        return True
    return questions_asked >= MAX_QUESTIONS


def next_question(extracted: dict, questions_asked: int) -> str:
    missing = missing_fields(extracted)
    if questions_asked < MIN_QUESTIONS:
        for field in ("summary", "impact", "when_started", "error_text", "attempted_fix"):
            if field in missing:
                return QUESTION_BY_FIELD[field]
        return "Any additional details that could help IT reproduce this issue quickly?"

    if missing:
        return QUESTION_BY_FIELD[missing[0]]
    return "Anything else you'd like included before I open this ticket?"


def build_ticket_description(extracted: dict) -> str:
    summary = (extracted.get("summary") or "").strip()
    impact = (extracted.get("impact") or "").strip()
    when_started = (extracted.get("when_started") or "").strip()
    error_text = (extracted.get("error_text") or "").strip()
    attempted_fix = (extracted.get("attempted_fix") or "").strip()

    parts = []
    if summary:
        parts.append(f"Issue: {summary}")
    if impact:
        parts.append(f"Impact: {impact}")
    if when_started:
        parts.append(f"Started: {when_started}")
    if error_text:
        parts.append(f"Symptoms/Error: {error_text}")
    if attempted_fix:
        parts.append(f"Tried: {attempted_fix}")
    if not parts:
        return "User reported an issue through AI chat intake."
    return " | ".join(parts)


async def ask_clarifying_question(messages: list[dict], user_message: str) -> str:
    full_messages = [{"role": "system", "content": CONVERSATION_SYSTEM_PROMPT}]
    full_messages.extend(messages)
    full_messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": MODEL_NAME, "messages": full_messages, "stream": False},
        )
        if response.status_code != 200:
            raise RuntimeError(f"Ollama error: {response.text}")
        text = response.json().get("message", {}).get("content", "").strip()
        return clean_response_for_display(text) or "Could you share one more detail about the issue?"


async def extract_ticket_context(messages: list[dict], user_message: str) -> dict:
    full_messages = [{"role": "system", "content": EXTRACTION_SYSTEM_PROMPT}]
    full_messages.extend(messages)
    full_messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={"model": MODEL_NAME, "messages": full_messages, "stream": False},
        )
        if response.status_code != 200:
            raise RuntimeError(f"Ollama error: {response.text}")

    raw = response.json().get("message", {}).get("content", "")
    try:
        parsed = _extract_json_blob(raw)
    except json.JSONDecodeError:
        parsed = {}

    return {
        "summary": (parsed.get("summary") or "").strip(),
        "impact": (parsed.get("impact") or "").strip(),
        "when_started": (parsed.get("when_started") or "").strip(),
        "error_text": (parsed.get("error_text") or "").strip(),
        "attempted_fix": (parsed.get("attempted_fix") or "").strip(),
        "urgency": _normalize_urgency(parsed.get("urgency", "normal")),
        "request_type": _normalize_request_type(parsed.get("request_type", "other")),
    }


async def check_ollama_status() -> dict:
    """Check if Ollama and model are available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags")
            if response.status_code != 200:
                return {"available": False, "error": "Ollama not responding"}

            models = [m.get("name", "") for m in response.json().get("models", [])]
            has_model = any(MODEL_NAME.split(":")[0] in m for m in models)

            return {
                "available": True,
                "model": MODEL_NAME,
                "model_ready": has_model,
                "models": models,
            }
    except Exception as e:
        return {"available": False, "error": str(e)}


async def pull_model() -> bool:
    """Pull the model if not downloaded."""
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/pull",
                json={"name": MODEL_NAME, "stream": False},
            )
            return response.status_code == 200
    except Exception:
        return False


def extract_ticket_json(text: str) -> Optional[dict]:
    """Extract ticket JSON from AI response."""
    match = re.search(r"```json\s*(\{[^`]+\})\s*```", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            if data.get("ready") and data.get("description"):
                return {
                    "description": data.get("description", ""),
                    "urgency": data.get("urgency", "normal"),
                    "request_type": data.get("request_type", "other"),
                }
        except json.JSONDecodeError:
            pass
    return None


def clean_response_for_display(text: str) -> str:
    """Remove JSON blocks from AI text so users never see machine payloads."""
    cleaned = re.sub(r"```json\s*\{[^`]+\}\s*```", "", text, flags=re.DOTALL)
    cleaned = re.sub(r"\{(?:[^{}]|(?:\{[^{}]*\}))*\}", "", cleaned).strip()
    cleaned = cleaned.strip()
    return cleaned
