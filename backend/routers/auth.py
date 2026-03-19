from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import create_access_token, get_current_user
from backend.models import User
from backend.schemas.auth import LoginRequest, SignUpRequest, Token, UserResponse
from backend.services.auth import authenticate_user, create_patient_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(payload: SignUpRequest, db: Annotated[Session, Depends(get_db)]):
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
    token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=token)


@router.get("/verify", response_model=UserResponse)
def verify(user: Annotated[User, Depends(get_current_user)]):
    full_name = getattr(user.patient, "full_name", None)
    return UserResponse(id=user.id, email=user.email, role=user.role, full_name=full_name)
