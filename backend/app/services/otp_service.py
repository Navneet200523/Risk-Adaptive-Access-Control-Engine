"""OTP generation, storage, and verification service."""
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.otp import OTPRecord
from app.config import settings


class OTPService:
    @staticmethod
    def generate_otp() -> str:
        return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))

    @staticmethod
    async def create_otp(db: AsyncSession, user_id: str, email: str) -> str:
        otp_code = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp_record = OTPRecord(
            user_id=user_id,
            email=email,
            otp_code=otp_code,
            expires_at=expires_at,
        )
        db.add(otp_record)
        await db.commit()
        return otp_code

    @staticmethod
    async def verify_otp(db: AsyncSession, email: str, otp_code: str) -> bool:
        result = await db.execute(
            select(OTPRecord).where(
                and_(
                    OTPRecord.email == email,
                    OTPRecord.otp_code == otp_code,
                    OTPRecord.is_used == False,
                    OTPRecord.expires_at > datetime.utcnow(),
                )
            ).order_by(OTPRecord.created_at.desc()).limit(1)
        )
        otp_record = result.scalar_one_or_none()
        if otp_record:
            otp_record.is_used = True
            await db.commit()
            return True
        return False
