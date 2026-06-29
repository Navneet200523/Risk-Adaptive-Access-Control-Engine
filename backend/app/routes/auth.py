"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, MFARequest, RefreshRequest, ForgotPasswordRequest, ForgotPasswordVerifyRequest, ForgotPasswordResetRequest
from app.services.auth_service import AuthService
from app.security.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await AuthService.register(db, req.email, req.username, req.full_name, req.password, req.department or "General")
        return {"message": "Registration successful", "user": {"id": user.id, "email": user.email, "username": user.username, "role": user.role.value}}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await AuthService.login(db, req.email, req.password, request, req.device_fingerprint, req.browser, req.os)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/mfa")
async def verify_mfa(req: MFARequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await AuthService.verify_mfa(db, req.email, req.otp_code, req.device_fingerprint)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await AuthService.refresh(db, req.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await AuthService.logout(db, user.id)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value,
        "department": user.department,
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await AuthService.forgot_password(db, req.email)
    return result


@router.post("/forgot-password/verify")
async def forgot_password_verify(req: ForgotPasswordVerifyRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await AuthService.forgot_password_verify(db, req.email, req.otp_code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password/reset")
async def forgot_password_reset(req: ForgotPasswordResetRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await AuthService.forgot_password_reset(db, req.email, req.otp_code, req.new_password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
