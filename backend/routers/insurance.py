from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models import Insurance, Patient
from backend.schemas.insurance import InsuranceResponse, InsuranceVerifyRequest

router = APIRouter(prefix="/insurance", tags=["insurance"])


@router.post("/verify", response_model=dict)
def verify_insurance(payload: InsuranceVerifyRequest, db: Annotated[Session, Depends(get_db)]):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    record = (
        db.query(Insurance)
        .filter(Insurance.policy_number == payload.policy_number, Insurance.id == patient.insurance_id)
        .first()
    )
    if not record:
        return {"verified": False, "reason": "No matching policy"}
    return {"verified": True, "provider": record.provider, "valid_through": record.valid_through}


@router.get("/{insurance_id}", response_model=InsuranceResponse)
def get_insurance(insurance_id: int, db: Annotated[Session, Depends(get_db)]):
    record = db.query(Insurance).filter(Insurance.id == insurance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance not found")
    return record
