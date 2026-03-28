from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models import Patient, TriageLog, UrgencyLevel, User, UserRole
from backend.schemas.triage import SymptomInput, TriageLogResponse, TriageResult
from backend.services.triage_service import llm_triage, log_triage, rule_based_triage

router = APIRouter(prefix="/triage", tags=["triage"])


@router.post("/analyze", response_model=TriageResult)
def analyze_symptoms(
    payload: SymptomInput,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    if user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Triage is available for patient accounts")

    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile missing")
    llm_provider = getattr(request.app.state, "llm_provider", None)
    if llm_provider is not None:
        urgency, rationale = llm_triage(llm_provider, payload.symptoms)
    else:
        urgency, rationale = rule_based_triage(payload.symptoms)
    log_triage(db, patient.id, payload.symptoms, urgency)
    return TriageResult(urgency=urgency, rationale=rationale)


@router.get("/logs", response_model=list[TriageLogResponse])
def list_logs(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile missing")
    logs = db.query(TriageLog).filter(TriageLog.patient_id == patient.id).order_by(TriageLog.created_at.desc()).all()
    return logs
