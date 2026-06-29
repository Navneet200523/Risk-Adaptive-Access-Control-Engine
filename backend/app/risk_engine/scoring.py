"""Risk scoring engine — weighted formula producing 0-100 score."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.risk_policy import RiskPolicy


# Default weights
DEFAULT_WEIGHTS = {
    "device_mismatch": 20,
    "location_anomaly": 20,
    "vpn_network": 15,
    "off_hours": 10,
    "sensitive_resource": 25,
    "high_request_rate": 10,
}


class RiskScorer:
    """Calculates risk score using weighted sum of normalized factors."""

    @staticmethod
    async def get_weights(db: Optional[AsyncSession] = None) -> dict:
        """Load weights from active risk policy or use defaults."""
        if db:
            try:
                result = await db.execute(
                    select(RiskPolicy).where(RiskPolicy.is_active == "true").limit(1)
                )
                policy = result.scalar_one_or_none()
                if policy:
                    return {
                        "device_mismatch": policy.weight_device_mismatch,
                        "location_anomaly": policy.weight_location_anomaly,
                        "vpn_network": policy.weight_vpn_network,
                        "off_hours": policy.weight_off_hours,
                        "sensitive_resource": policy.weight_sensitive_resource,
                        "high_request_rate": policy.weight_high_request_rate,
                    }
            except Exception:
                pass
        return DEFAULT_WEIGHTS.copy()

    @staticmethod
    async def calculate(factors: dict, db: Optional[AsyncSession] = None) -> int:
        """Calculate risk score: Σ(weight × factor_value). Returns 0-100."""
        weights = await RiskScorer.get_weights(db)
        score = 0.0
        for key, weight in weights.items():
            factor_value = factors.get(key, 0.0)
            score += weight * factor_value

        return min(100, max(0, int(score)))
