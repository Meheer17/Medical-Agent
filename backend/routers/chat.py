from dataclasses import dataclass, field
from threading import Lock
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models import Patient, User, UserRole
from backend.schemas.chat import ChatMessageRequest, ChatMessageResponse
from backend.schemas.triage import TriageResult
from backend.services.triage_service import llm_triage, log_triage, rule_based_triage
from backend.tools.api_tools import ToolingConfig, book_appointment, get_doctor_availability

router = APIRouter(prefix="/chat", tags=["chat"])


@dataclass
class SessionState:
    offered_slot: dict | None = None
    last_triage: TriageResult | None = None
    messages: list[dict[str, str]] = field(default_factory=list)


_SESSION_LOCK = Lock()
_SESSIONS: dict[str, SessionState] = {}


def _session_key(user_id: int, session_id: str) -> str:
    return f"{user_id}:{session_id}"


def _get_or_create_session(user_id: int, session_id: str) -> SessionState:
    key = _session_key(user_id, session_id)
    with _SESSION_LOCK:
        state = _SESSIONS.get(key)
        if state is None:
            state = SessionState()
            _SESSIONS[key] = state
        return state


def _remember(state: SessionState, role: str, text: str) -> None:
    state.messages.append({"role": role, "text": text})
    if len(state.messages) > 30:
        state.messages = state.messages[-30:]


def _is_confirm_booking(text: str) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in ["book", "confirm", "yes", "go ahead", "proceed"])


def _is_reject_booking(text: str) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in ["no", "not now", "later", "different"])


def _extract_bearer_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip() or None
    return None


@router.post("/message", response_model=ChatMessageResponse)
def chat_message(
    payload: ChatMessageRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    session_id = payload.session_id or str(uuid4())
    state = _get_or_create_session(user.id, session_id)
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message is required")

    _remember(state, "user", message)

    if user.role != UserRole.PATIENT:
        reply = "Appointment triage chat is currently available for patient accounts."
        _remember(state, "assistant", reply)
        return ChatMessageResponse(session_id=session_id, reply=reply)

    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile missing")

    base_url = str(request.base_url).rstrip("/")
    token = _extract_bearer_token(request)
    tool_config = ToolingConfig(base_url=base_url, token=token)

    if state.offered_slot and _is_confirm_booking(message):
        offered = state.offered_slot
        appointment = book_appointment(
            tool_config,
            patient_id=patient.id,
            doctor_id=int(offered["doctor_id"]),
            scheduled_at=str(offered["slot"]),
            notes=f"Booked from chat triage session {session_id}",
        )
        state.offered_slot = None
        reply = (
            f"Booked successfully. Appointment #{appointment['id']} with Dr. {offered['doctor_name']} "
            f"at {offered['slot']}."
        )
        _remember(state, "assistant", reply)
        return ChatMessageResponse(
            session_id=session_id,
            reply=reply,
            appointment=appointment,
        )

    if state.offered_slot and _is_reject_booking(message):
        state.offered_slot = None
        reply = "Okay, I cancelled that slot suggestion. Share symptoms or specialty preference and I will fetch new options."
        _remember(state, "assistant", reply)
        return ChatMessageResponse(session_id=session_id, reply=reply)

    llm_provider = getattr(request.app.state, "llm_provider", None)
    if llm_provider is not None:
        urgency, rationale = llm_triage(llm_provider, message)
    else:
        urgency, rationale = rule_based_triage(message)

    log_triage(db, patient.id, message, urgency)
    triage_result = TriageResult(urgency=urgency, rationale=rationale)
    state.last_triage = triage_result

    # Use the tool layer so triage chat relies on the same API tool contract as agent workflows.
    slots = get_doctor_availability(tool_config, specialty=None)
    if not slots:
        reply = f"Urgency: {urgency.value.upper()}. {rationale} No doctor slots are currently available."
        _remember(state, "assistant", reply)
        return ChatMessageResponse(session_id=session_id, reply=reply, triage=triage_result)

    first = slots[0]
    state.offered_slot = {
        "doctor_id": first["doctor_id"],
        "doctor_name": first["doctor_name"],
        "specialty": first["specialty"],
        "slot": first["slot"],
    }
    reply = (
        f"Urgency: {urgency.value.upper()}. {rationale}\n"
        f"I found an available slot with Dr. {first['doctor_name']} ({first['specialty']}) at {first['slot']}. "
        "Reply 'book this slot' to confirm, or reply 'different slot' to skip."
    )
    _remember(state, "assistant", reply)
    return ChatMessageResponse(
        session_id=session_id,
        reply=reply,
        triage=triage_result,
        offered_slot=state.offered_slot,
    )
