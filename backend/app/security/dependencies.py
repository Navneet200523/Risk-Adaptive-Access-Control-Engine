"""Security dependencies — user extraction and role checks."""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.security.jwt_handler import decode_token
from app.models.user import User, UserRole
from app.models.risk_policy import RiskPolicy
from app.risk_engine.context_collector import ContextCollector
from app.risk_engine.context_normalizer import ContextNormalizer
from app.risk_engine.scoring import RiskScorer
from app.risk_engine.decision_engine import DecisionEngine
from app.services.auth_service import AuthService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


def require_role(*roles: UserRole):
    """Dependency factory for role-based access."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role.value}' does not have access. Required: {[r.value for r in roles]}"
            )
        return user
    return role_checker


async def require_risk_check(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency to check risk score and force logout if high."""
    # Collect context and calculate risk
    context = await ContextCollector.collect(request)
    factors = await ContextNormalizer.normalize(context, user.id, db)
    risk_score = await RiskScorer.calculate(factors, db)

    # Get thresholds
    _, high_threshold = await DecisionEngine.get_thresholds(db)

    if risk_score > high_threshold:
        # LOGOUT USER IMMEDIATELY
        await AuthService.force_logout_all(db, user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SESSION_TERMINATED_HIGH_RISK"
        )

    return user


async def require_severe_access(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency for severe actions (admin logs, users, policy).
    Triggers immediate logout if:
    1. Risk score is high.
    2. User is not an ADMIN.
    """
    # 1. Risk Check (Always check risk for severe actions)
    context = await ContextCollector.collect(request)
    factors = await ContextNormalizer.normalize(context, user.id, db)
    risk_score = await RiskScorer.calculate(factors, db)
    _, high_threshold = await DecisionEngine.get_thresholds(db)

    if risk_score > high_threshold:
        await AuthService.force_logout_all(db, user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SESSION_TERMINATED_HIGH_RISK"
        )

    # 2. Role Check (Accessing severe action without admin role triggers logout)
    if user.role != UserRole.ADMIN:
        await AuthService.force_logout_all(db, user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="SESSION_TERMINATED_UNAUTHORIZED"
        )

    return user
