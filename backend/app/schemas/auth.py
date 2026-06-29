"""Authentication schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    department: Optional[str] = "General"


class LoginRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None


class MFARequest(BaseModel):
    email: str
    otp_code: str
    device_fingerprint: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RiskDecisionResponse(BaseModel):
    status: str  # ALLOW, MFA_REQUIRED, DENY
    risk_score: int
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[dict] = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: str
    department: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordVerifyRequest(BaseModel):
    email: str
    otp_code: str


class ForgotPasswordResetRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str
