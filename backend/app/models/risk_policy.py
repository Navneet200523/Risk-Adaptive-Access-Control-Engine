"""Risk policy model — admin-configurable risk weights and thresholds."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base


class RiskPolicy(Base):
    __tablename__ = "risk_policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    # Weights (0-100)
    weight_device_mismatch = Column(Integer, default=20)
    weight_location_anomaly = Column(Integer, default=20)
    weight_vpn_network = Column(Integer, default=15)
    weight_off_hours = Column(Integer, default=10)
    weight_sensitive_resource = Column(Integer, default=25)
    weight_high_request_rate = Column(Integer, default=10)
    # Thresholds
    low_threshold = Column(Integer, default=30)
    high_threshold = Column(Integer, default=60)
    # Allowed countries (comma-separated)
    allowed_countries = Column(Text, default="")
    # Device trust duration (hours)
    device_trust_duration = Column(Integer, default=720)  # 30 days
    is_active = Column(String, default="true")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
