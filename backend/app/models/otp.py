"""OTP record model — Redis-backed but DB fallback."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base


class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False)
    otp_code = Column(String, nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
