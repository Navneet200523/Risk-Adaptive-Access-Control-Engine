"""Admin and security schemas."""
from pydantic import BaseModel
from typing import Optional


class CreateUserRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    role: str = "employee"
    department: str = "General"


class AccessLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource: str
    risk_score: int
    decision: str
    ip_address: Optional[str] = None
    device_fingerprint: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    is_vpn: Optional[str] = None
    timestamp: str

    class Config:
        from_attributes = True


class RiskStatsResponse(BaseModel):
    total_requests: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    denied_count: int
    mfa_triggered_count: int
    avg_risk_score: float
    recent_suspicious: list[dict]
