import pytest

from app.services.chat_service import (
    MIN_QUESTIONS,
    MAX_QUESTIONS,
    clean_response_for_display,
    count_assistant_questions,
    missing_fields,
    should_create_ticket,
    build_ticket_description,
    next_question,
    suggest_ticket_from_text,
)


def test_clean_response_removes_json_block():
    text = """I can create your ticket now.
```json
{"ready": true, "description": "Printer not working"}
```"""
    cleaned = clean_response_for_display(text)
    assert "ready" not in cleaned
    assert "description" not in cleaned
    assert "I can create your ticket now." in cleaned


def test_count_assistant_questions_ignores_welcome():
    messages = [
        {
            "role": "assistant",
            "content": "Hi! I'm your IT support assistant. Tell me about the issue?",
        },
        {"role": "assistant", "content": "When did this start?"},
        {"role": "assistant", "content": "Do you see any error message?"},
        {"role": "user", "content": "Since yesterday"},
    ]
    assert count_assistant_questions(messages) == 2


def test_should_create_ticket_requires_min_questions():
    extracted = {
        "summary": "Excel crashes on open",
        "impact": "Cannot finish report",
        "when_started": "today morning",
        "error_text": "App closed unexpectedly",
        "attempted_fix": "Restarted laptop",
    }
    assert should_create_ticket(extracted, MIN_QUESTIONS - 1) is False
    assert should_create_ticket(extracted, MIN_QUESTIONS) is True


def test_should_create_ticket_forces_completion_at_max_questions():
    extracted = {
        "summary": "VPN disconnected",
        "impact": "",
        "when_started": "",
        "error_text": "",
        "attempted_fix": "",
    }
    assert missing_fields(extracted)
    assert should_create_ticket(extracted, MAX_QUESTIONS) is True


def test_build_ticket_description_contains_key_fields():
    extracted = {
        "summary": "Laptop overheats",
        "impact": "Work interrupted",
        "when_started": "2 days ago",
        "error_text": "Fan very loud",
        "attempted_fix": "Cleaned vents",
    }
    description = build_ticket_description(extracted)
    assert "Issue: Laptop overheats" in description
    assert "Impact: Work interrupted" in description
    assert "Started: 2 days ago" in description


def test_next_question_targets_missing_fields():
    extracted = {
        "summary": "",
        "impact": "",
        "when_started": "",
        "error_text": "",
        "attempted_fix": "",
    }
    q = next_question(extracted, 0)
    assert q.endswith("?")


@pytest.mark.anyio
async def test_suggest_ticket_handles_logistics_wet_desk(monkeypatch):
    async def fake_extract(_messages, _message):
        return {
            "summary": "",
            "impact": "",
            "when_started": "",
            "error_text": "",
            "attempted_fix": "",
            "urgency": "normal",
            "request_type": "other",
        }

    monkeypatch.setattr(
        "app.services.chat_service.extract_ticket_context", fake_extract
    )
    result = await suggest_ticket_from_text(
        "my desk is wet please send a cleaner to floor 3 table 201"
    )
    assert result["request_type"] == "logistics"
    assert "Wet/spill cleanup request" in result["description"]
    assert "floor 3 table 201" in result["description"].lower()
    assert all("error message" not in q.lower() for q in result["follow_up_questions"])


@pytest.mark.anyio
async def test_suggest_ticket_replaces_generic_llm_summary(monkeypatch):
    async def fake_extract(_messages, _message):
        return {
            "summary": "ticket-intake request",
            "impact": "",
            "when_started": "",
            "error_text": "",
            "attempted_fix": "",
            "urgency": "normal",
            "request_type": "other",
        }

    monkeypatch.setattr(
        "app.services.chat_service.extract_ticket_context", fake_extract
    )
    raw_text = "Need cleaner in room 12, water leak near desk 5."
    result = await suggest_ticket_from_text(raw_text)
    assert "ticket-intake request" not in result["description"].lower()
    assert (
        "water leak" in result["description"].lower()
        or "wet/spill" in result["description"].lower()
    )
