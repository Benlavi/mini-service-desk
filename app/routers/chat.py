"""Chat Router - AI chat endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.database import get_session
from app.models.ticket import (
    Ticket,
    TicketRead,
    TicketStatus,
    TicketRequestType,
    TicketUrgency,
    now_utc,
)
from app.models.user import User
from app.services.security import get_current_user
from app.services.chat_service import (
    ask_clarifying_question,
    check_ollama_status,
    pull_model,
    extract_ticket_context,
    clean_response_for_display,
    count_assistant_questions,
    should_create_ticket,
    next_question,
    build_ticket_description,
    suggest_ticket_from_text,
)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = []
    message: str


class ChatResponse(BaseModel):
    response: str
    ticket_data: dict | None = None
    ticket: TicketRead | None = None
    chat_ended: bool = False


class CreateTicketRequest(BaseModel):
    description: str
    urgency: str = "normal"
    request_type: str = "other"


class AssistFormRequest(BaseModel):
    message: str


class AssistFormResponse(BaseModel):
    description: str
    urgency: str
    request_type: str
    follow_up_questions: list[str] = []


@router.get("/status")
async def chat_status():
    """Check Ollama availability."""
    return await check_ollama_status()


@router.post("/pull-model")
async def trigger_pull(current_user: User = Depends(get_current_user)):
    """Download the AI model."""
    if await pull_model():
        return {"status": "ok"}
    raise HTTPException(status_code=500, detail="Failed to pull model")


@router.post("/message", response_model=ChatResponse)
async def send_message(
    payload: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Send chat message and get AI response."""
    ollama_status = await check_ollama_status()

    if not ollama_status.get("available"):
        raise HTTPException(
            status_code=503, detail="Ollama not available. Starting up..."
        )

    if not ollama_status.get("model_ready"):
        await pull_model()
        raise HTTPException(
            status_code=503, detail="Model downloading. Please wait 1-2 minutes..."
        )

    history = [{"role": m.role, "content": m.content} for m in payload.messages]
    questions_asked = count_assistant_questions(history)

    try:
        extracted = await extract_ticket_context(history, payload.message)
        questions_asked_after_reply = questions_asked + 1

        if should_create_ticket(extracted, questions_asked_after_reply):
            description = build_ticket_description(extracted)

            try:
                urgency = TicketUrgency(extracted.get("urgency", "normal"))
            except ValueError:
                urgency = TicketUrgency.normal

            try:
                request_type = TicketRequestType(extracted.get("request_type", "other"))
            except ValueError:
                request_type = TicketRequestType.other

            ticket = Ticket(
                description=description,
                request_type=request_type,
                urgency=urgency,
                status=TicketStatus.new,
                operator_id=None,
                created_by_id=current_user.id,
                created_at=now_utc(),
                updated_at=now_utc(),
            )
            session.add(ticket)
            session.commit()
            session.refresh(ticket)

            return ChatResponse(
                response=f"Thanks, I created your ticket (#{ticket.id}). This chat is now complete.",
                ticket=ticket,
                ticket_data=None,
                chat_ended=True,
            )

        question = next_question(extracted, questions_asked)
        llm_question = await ask_clarifying_question(history, payload.message)
        # Prefer deterministic question if model drifts from intake goal.
        safe_question = llm_question if "?" in llm_question else question
        clean_response = clean_response_for_display(safe_question)
        return ChatResponse(response=clean_response, ticket_data=None, chat_ended=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assist-form", response_model=AssistFormResponse)
async def assist_form(
    payload: AssistFormRequest,
    _current_user: User = Depends(get_current_user),
):
    """AI-assisted extraction for form-based ticket creation."""
    raw = payload.message.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Message is required")

    ollama_status = await check_ollama_status()
    if not ollama_status.get("available"):
        raise HTTPException(
            status_code=503, detail="Ollama not available. Starting up..."
        )

    if not ollama_status.get("model_ready"):
        await pull_model()
        raise HTTPException(
            status_code=503, detail="Model downloading. Please wait 1-2 minutes..."
        )

    try:
        suggestion = await suggest_ticket_from_text(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return AssistFormResponse(**suggestion)


@router.post("/create-ticket", response_model=TicketRead, status_code=201)
async def create_ticket(
    payload: CreateTicketRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create ticket from chat data."""
    try:
        urgency = TicketUrgency(payload.urgency)
    except ValueError:
        urgency = TicketUrgency.normal

    try:
        request_type = TicketRequestType(payload.request_type)
    except ValueError:
        request_type = TicketRequestType.other

    ticket = Ticket(
        description=payload.description,
        request_type=request_type,
        urgency=urgency,
        status=TicketStatus.new,
        operator_id=None,
        created_by_id=current_user.id,
        created_at=now_utc(),
        updated_at=now_utc(),
    )

    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket
