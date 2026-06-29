"""Access log model — every request is logged."""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    risk_score = Column(Integer, default=0)
    decision = Column(String, default="ALLOW")
    ip_address = Column(String, nullable=True)
    device_fingerprint = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_vpn = Column(String, default="false")
    timestamp = Column(DateTime, default=lambda: datetime.now(IST), index=True)

    user = relationship("User", back_populates="access_logs")
