from datetime import datetime
from pydantic import BaseModel

from backend.models.triage_log import UrgencyLevel


class SymptomInput(BaseModel):
    symptoms: str


class TriageResult(BaseModel):
    urgency: UrgencyLevel
    rationale: str


class TriageLogResponse(BaseModel):
    id: int
    patient_id: int
    symptoms: str
    urgency_level: UrgencyLevel
    created_at: datetime

    class Config:
        from_attributes = True
