"""Authentication service — handles login, registration, MFA orchestration."""
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Request

from app.models.user import User, UserRole
from app.models.device import Device
from app.models.session import Session
from app.models.otp import OTPRecord
from app.security.password import hash_password, verify_password
from app.security.jwt_handler import create_access_token, create_refresh_token
from app.services.otp_service import OTPService
from app.utils.email import send_otp_email, send_password_reset_email
from app.risk_engine.context_collector import ContextCollector
from app.risk_engine.context_normalizer import ContextNormalizer
from app.risk_engine.scoring import RiskScorer
from app.risk_engine.decision_engine import DecisionEngine
from app.config import settings

import logging

logger = logging.getLogger(__name__)


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, email: str, username: str, full_name: str, password: str, department: str = "General") -> User:
        # Check if user exists
        existing = await db.execute(select(User).where((User.email == email) | (User.username == username)))
        if existing.scalar_one_or_none():
            raise ValueError("User with this email or username already exists")

        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=UserRole.EMPLOYEE,
            department=department,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def login(db: AsyncSession, email: str, password: str, request: Request, device_fingerprint: str = None, browser: str = None, os_name: str = None) -> dict:
        # Find user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError("Invalid email or password")

        # Check lockout
        if user.is_locked and user.locked_until and user.locked_until > datetime.utcnow():
            remaining = int((user.locked_until - datetime.utcnow()).total_seconds())
            raise ValueError(f"Account locked. Try again in {remaining} seconds")

        # Reset lock if expired
        if user.is_locked and user.locked_until and user.locked_until <= datetime.utcnow():
            user.is_locked = False
            user.failed_login_attempts = 0

        # Verify password
        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.ACCOUNT_LOCKOUT_ATTEMPTS:
                user.is_locked = True
                user.locked_until = datetime.utcnow() + timedelta(seconds=settings.ACCOUNT_LOCKOUT_DURATION)
            await db.commit()
            raise ValueError("Invalid email or password")

        # Collect context & evaluate risk
        context = await ContextCollector.collect(request, device_fingerprint)
        if browser:
            context["browser"] = browser
        if os_name:
            context["os"] = os_name

        factors = await ContextNormalizer.normalize(context, user.id, db)
        risk_score = await RiskScorer.calculate(factors, db)
        decision = await DecisionEngine.decide(risk_score, db)

        # Register device if new
        await AuthService._register_device(db, user.id, device_fingerprint or "unknown", context)

        if decision["decision"] == "DENY":
            logger.warning("Login DENIED for %s (risk=%d)", email, risk_score)
            return {
                "status": "DENY",
                "risk_score": risk_score,
                "message": decision["message"],
            }

        if decision["decision"] == "MFA_REQUIRED":
            otp_code = await OTPService.create_otp(db, user.id, user.email)
            await send_otp_email(user.email, otp_code, user.full_name)
            logger.info("MFA triggered for %s (risk=%d)", email, risk_score)
            return {
                "status": "MFA_REQUIRED",
                "risk_score": risk_score,
                "message": decision["message"],
            }

        # ALLOW — create session
        return await AuthService._create_session(db, user, device_fingerprint, risk_score)

    @staticmethod
    async def verify_mfa(db: AsyncSession, email: str, otp_code: str, device_fingerprint: str = None) -> dict:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        if not await OTPService.verify_otp(db, email, otp_code):
            raise ValueError("Invalid or expired OTP code")

        return await AuthService._create_session(db, user, device_fingerprint, 0)

    @staticmethod
    async def refresh(db: AsyncSession, refresh_token: str) -> dict:
        from app.security.jwt_handler import decode_token
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = payload.get("sub")
        result = await db.execute(
            select(Session).where(
                Session.refresh_token == refresh_token,
                Session.is_active == True,
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise ValueError("Session not found or expired")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        access_token = create_access_token({"sub": user.id, "role": user.role.value})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    @staticmethod
    async def logout(db: AsyncSession, user_id: str, refresh_token: str = None):
        if refresh_token:
            result = await db.execute(
                select(Session).where(Session.refresh_token == refresh_token)
            )
            session = result.scalar_one_or_none()
            if session:
                session.is_active = False
                await db.commit()
        else:
            # Fallback to logging out all if no token provided (optional behavior)
            result = await db.execute(
                select(Session).where(Session.user_id == user_id, Session.is_active == True)
            )
            sessions = result.scalars().all()
            for s in sessions:
                s.is_active = False
            await db.commit()

    @staticmethod
    async def force_logout_all(db: AsyncSession, user_id: str):
        """Invalidate all active sessions for a user."""
        result = await db.execute(
            select(Session).where(Session.user_id == user_id, Session.is_active == True)
        )
        sessions = result.scalars().all()
        for s in sessions:
            s.is_active = False
        await db.commit()
        logger.warning("FORCED LOGOUT for user_id=%s due to high risk.", user_id)

    @staticmethod
    async def _create_session(db: AsyncSession, user: User, device_fingerprint: str, risk_score: int) -> dict:
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()

        access_token = create_access_token({"sub": user.id, "role": user.role.value})
        refresh_token = create_refresh_token({"sub": user.id})

        session = Session(
            user_id=user.id,
            refresh_token=refresh_token,
            device_fingerprint=device_fingerprint,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(session)
        await db.commit()

        return {
            "status": "ALLOW",
            "risk_score": risk_score,
            "message": "Access granted",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "department": user.department,
            },
        }

    @staticmethod
    async def _register_device(db: AsyncSession, user_id: str, fingerprint: str, context: dict):
        if fingerprint == "unknown":
            return
        result = await db.execute(
            select(Device).where(Device.user_id == user_id, Device.fingerprint == fingerprint)
        )
        device = result.scalar_one_or_none()
        if not device:
            device = Device(
                user_id=user_id,
                fingerprint=fingerprint,
                browser=context.get("browser"),
                os=context.get("os"),
                ip_address=context.get("ip_address"),
            )
            db.add(device)
        else:
            device.last_seen = datetime.utcnow()
            device.ip_address = context.get("ip_address")
        await db.commit()

    @staticmethod
    async def forgot_password(db: AsyncSession, email: str) -> dict:
        """Step 1: Check if email exists and send password reset OTP."""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            otp_code = await OTPService.create_otp(db, user.id, user.email)
            await send_password_reset_email(user.email, otp_code, user.full_name)
            logger.info("Password reset OTP sent to %s", email)
        else:
            logger.warning("Password reset requested for non-existent email: %s", email)

        # Always return generic message to prevent email enumeration
        return {"message": "If an account with that email exists, a verification code has been sent."}

    @staticmethod
    async def forgot_password_verify(db: AsyncSession, email: str, otp_code: str) -> dict:
        """Step 2: Verify the OTP code without consuming it."""
        # Check OTP is valid (peek, don't consume)
        result = await db.execute(
            select(OTPRecord).where(
                OTPRecord.email == email,
                OTPRecord.otp_code == otp_code,
                OTPRecord.is_used == False,
                OTPRecord.expires_at > datetime.utcnow(),
            ).order_by(OTPRecord.created_at.desc()).limit(1)
        )
        otp_record = result.scalar_one_or_none()

        if not otp_record:
            raise ValueError("Invalid or expired verification code")

        return {"message": "Code verified successfully. You may now reset your password."}

    @staticmethod
    async def forgot_password_reset(db: AsyncSession, email: str, otp_code: str, new_password: str) -> dict:
        """Step 3: Consume the OTP and reset the password."""
        # Verify and consume OTP
        if not await OTPService.verify_otp(db, email, otp_code):
            raise ValueError("Invalid or expired verification code")

        # Find user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        # Update password
        user.hashed_password = hash_password(new_password)
        user.failed_login_attempts = 0
        user.is_locked = False
        user.locked_until = None

        # Invalidate all active sessions (security best practice)
        sessions_result = await db.execute(
            select(Session).where(Session.user_id == user.id, Session.is_active == True)
        )
        for session in sessions_result.scalars().all():
            session.is_active = False

        await db.commit()
        logger.info("Password reset successfully for %s", email)
        return {"message": "Password has been reset successfully. Please login with your new password."}

