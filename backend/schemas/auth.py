from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from backend.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    role: UserRole


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str
    role: UserRole = UserRole.PATIENT
    specialty: Optional[str] = None
    location: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    full_name: Optional[str]

    class Config:
        from_attributes = True
