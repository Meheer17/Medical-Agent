from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    insurance_id: Optional[int] = None


class PatientCreate(PatientBase):
    email: EmailStr
    password: str


class PatientUpdate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
