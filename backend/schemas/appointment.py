from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from backend.models.appointment import AppointmentStatus


class AppointmentRequest(BaseModel):
    patient_id: int
    doctor_id: int
    scheduled_at: datetime
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    scheduled_at: datetime
    status: AppointmentStatus
    notes: Optional[str]

    class Config:
        from_attributes = True
