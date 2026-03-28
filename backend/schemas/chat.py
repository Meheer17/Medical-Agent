from typing import Any

from pydantic import BaseModel, Field

from backend.schemas.appointment import AppointmentResponse
from backend.schemas.triage import TriageResult


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = Field(default=None, max_length=120)


class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    triage: TriageResult | None = None
    offered_slot: dict[str, Any] | None = None
    appointment: AppointmentResponse | None = None
