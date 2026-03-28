from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.security import hash_password, verify_password
from backend.models import Doctor, Patient, User, UserRole


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_patient_user(db: Session, email: str, password: str, full_name: str) -> Patient:
    if get_user_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=email, hashed_password=hash_password(password), role=UserRole.PATIENT)
    patient = Patient(full_name=full_name, user=user)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def create_doctor_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
    specialty: str,
    location: str | None = None,
) -> Doctor:
    if get_user_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=email, hashed_password=hash_password(password), role=UserRole.DOCTOR)
    doctor = Doctor(full_name=full_name, specialty=specialty, location=location, user=user)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user
