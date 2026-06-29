"""Device model — tracks known devices per user."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fingerprint = Column(String, nullable=False)
    browser = Column(String, nullable=True)
    os = Column(String, nullable=True)
    device_name = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    is_trusted = Column(Boolean, default=False)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")
