"""Decision engine — maps risk score to access decisions."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.risk_policy import RiskPolicy
from app.config import settings


class DecisionEngine:
    """Maps risk score to ALLOW / MFA_REQUIRED / DENY."""

    @staticmethod
    async def get_thresholds(db: Optional[AsyncSession] = None) -> tuple[int, int]:
        if db:
            try:
                result = await db.execute(
                    select(RiskPolicy).where(RiskPolicy.is_active == "true").limit(1)
                )
                policy = result.scalar_one_or_none()
                if policy:
                    return policy.low_threshold, policy.high_threshold
            except Exception:
                pass
        return settings.RISK_LOW_THRESHOLD, settings.RISK_HIGH_THRESHOLD

    @staticmethod
    async def decide(risk_score: int, db: Optional[AsyncSession] = None) -> dict:
        low, high = await DecisionEngine.get_thresholds(db)

        if risk_score <= low:
            return {
                "risk_score": risk_score,
                "decision": "ALLOW",
                "access_level": "full",
                "message": "Access granted — low risk detected.",
            }
        elif risk_score <= high:
            return {
                "risk_score": risk_score,
                "decision": "MFA_REQUIRED",
                "access_level": "limited",
                "message": "Additional verification required — medium risk detected.",
            }
        else:
            return {
                "risk_score": risk_score,
                "decision": "DENY",
                "access_level": "none",
                "message": "Access denied — high risk detected. Incident logged.",
            }
