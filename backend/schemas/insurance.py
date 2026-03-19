from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class InsuranceVerifyRequest(BaseModel):
    patient_id: int
    policy_number: str


class InsuranceResponse(BaseModel):
    id: int
    provider: str
    policy_number: str
    valid_through: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True
