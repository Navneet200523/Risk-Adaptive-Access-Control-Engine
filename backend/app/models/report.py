"""Report model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String, default="general")  # general, security, risk, activity
    generated_by = Column(String, nullable=True)
    data = Column(Text, nullable=True)  # JSON data
    created_at = Column(DateTime, default=datetime.utcnow)
