from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models import Appointment, AppointmentStatus, Doctor, Patient, User, UserRole
from backend.schemas.appointment import AppointmentRequest, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["appointments"])
FORBIDDEN_DETAIL = "Not allowed"


@router.post("/book", response_model=AppointmentResponse)
def book_appointment(
    payload: AppointmentRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if user.role == UserRole.PATIENT and patient.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_DETAIL)
    if user.role == UserRole.DOCTOR and doctor.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_DETAIL)
    appointment = Appointment(
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status=AppointmentStatus.PENDING,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/my-schedule", response_model=list[AppointmentResponse])
def my_schedule(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    if user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile missing")
        return (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient.id)
            .order_by(Appointment.scheduled_at.asc())
            .all()
        )
    elif user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile missing")

        doctor_ids = [doctor.id]
        # Legacy-safe fallback: if duplicate doctor rows exist with equivalent name/specialty,
        # include them to avoid missing appointments because of historical profile splits.
        duplicate_ids = (
            db.query(Doctor.id)
            .filter(
                Doctor.id != doctor.id,
                func.lower(func.trim(Doctor.full_name)) == func.lower(func.trim(doctor.full_name)),
                func.lower(func.trim(Doctor.specialty)) == func.lower(func.trim(doctor.specialty)),
            )
            .all()
        )
        doctor_ids.extend([row[0] for row in duplicate_ids])

        return (
            db.query(Appointment)
            .filter(Appointment.doctor_id.in_(doctor_ids))
            .order_by(Appointment.scheduled_at.asc())
            .all()
        )

    return db.query(Appointment).order_by(Appointment.scheduled_at.asc()).all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if user.role == UserRole.PATIENT and appt.patient.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_DETAIL)
    if user.role == UserRole.DOCTOR and appt.doctor.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN_DETAIL)
    return appt
