from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.doctor import DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/availability", response_model=list[dict])
def get_doctor_availability(
    specialty: str | None = None,
    db: Annotated[Session, Depends(get_db)] | None = None,
):
    # Minimal stub availability for demo purposes.
    now = datetime.utcnow()
    slots = []
    for i in range(3):
        slots.append(
            {
                "doctor_id": i + 1,
                "doctor_name": f"Dr. Demo {i+1}",
                "specialty": specialty or "general",
                "slot": (now + timedelta(days=i, hours=2)).isoformat(),
            }
        )
    return slots


@router.get("", response_model=list[DoctorResponse])
def list_doctors(db: Annotated[Session, Depends(get_db)]):
    from backend.models import Doctor

    return db.query(Doctor).all()
