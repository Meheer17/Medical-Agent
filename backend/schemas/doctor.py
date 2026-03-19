from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DoctorResponse(BaseModel):
    id: int
    full_name: str
    specialty: str
    location: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
