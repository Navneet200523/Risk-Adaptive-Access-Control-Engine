"""Risk policy schemas."""
from pydantic import BaseModel
from typing import Optional


class RiskPolicyResponse(BaseModel):
    id: str
    name: str
    weight_device_mismatch: int
    weight_location_anomaly: int
    weight_vpn_network: int
    weight_off_hours: int
    weight_sensitive_resource: int
    weight_high_request_rate: int
    low_threshold: int
    high_threshold: int
    allowed_countries: Optional[str] = ""
    device_trust_duration: int
    is_active: str

    class Config:
        from_attributes = True


class RiskPolicyUpdateRequest(BaseModel):
    weight_device_mismatch: Optional[int] = None
    weight_location_anomaly: Optional[int] = None
    weight_vpn_network: Optional[int] = None
    weight_off_hours: Optional[int] = None
    weight_sensitive_resource: Optional[int] = None
    weight_high_request_rate: Optional[int] = None
    low_threshold: Optional[int] = None
    high_threshold: Optional[int] = None
    allowed_countries: Optional[str] = None
    device_trust_duration: Optional[int] = None
