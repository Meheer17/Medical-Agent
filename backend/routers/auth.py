from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import create_access_token, get_current_user
from backend.models import User, UserRole
from backend.schemas.auth import SignUpRequest, Token, UserResponse
from backend.services.auth import authenticate_user, create_doctor_user, create_patient_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(payload: SignUpRequest, db: Annotated[Session, Depends(get_db)]):
    if payload.role == UserRole.DOCTOR:
        if not payload.specialty:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="specialty is required for doctor signup")
        doctor = create_doctor_user(
            db,
            payload.email,
            payload.password,
            payload.full_name,
            payload.specialty,
            payload.location,
        )
        return UserResponse(
            id=doctor.user.id,
            email=doctor.user.email,
            role=doctor.user.role,
            full_name=doctor.full_name,
        )

    patient = create_patient_user(db, payload.email, payload.password, payload.full_name)
    return UserResponse(
        id=patient.user.id,
        email=patient.user.email,
        role=patient.user.role,
        full_name=patient.full_name,
    )


@router.post("/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    user = authenticate_user(db, form_data.username, form_data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token)


@router.get("/verify", response_model=UserResponse)
def verify(user: Annotated[User, Depends(get_current_user)]):
    full_name = None
    if getattr(user, "patient", None):
        full_name = user.patient.full_name
    elif getattr(user, "doctor", None):
        full_name = user.doctor.full_name
    return UserResponse(id=user.id, email=user.email, role=user.role, full_name=full_name)
