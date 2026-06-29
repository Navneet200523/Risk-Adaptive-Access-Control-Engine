"""Context normalization — converts raw context to risk factor values."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.device import Device
from app.models.risk_policy import RiskPolicy


class ContextNormalizer:
    """Normalizes raw context data into risk factor values (0.0 to 1.0)."""

    SENSITIVE_RESOURCES = ["/admin", "/risk-policy", "/security", "/api/admin"]
    OFF_HOURS_START = 0  # midnight
    OFF_HOURS_END = 5    # 5 AM

    @staticmethod
    async def normalize(
        context: dict,
        user_id: Optional[str],
        db: Optional[AsyncSession] = None,
    ) -> dict:
        """Return normalized risk factors."""
        factors = {}

        # 1. Device mismatch
        factors["device_mismatch"] = await ContextNormalizer._check_device(
            context.get("device_fingerprint", "unknown"), user_id, db
        )

        # 2. Location anomaly
        factors["location_anomaly"] = await ContextNormalizer._check_location(
            context.get("country", "Unknown"), db
        )

        # 3. VPN / proxy detection
        factors["vpn_network"] = 1.0 if context.get("is_vpn") else 0.0

        # 4. Off-hours access
        hour = context.get("hour", 12)
        factors["off_hours"] = 1.0 if ContextNormalizer.OFF_HOURS_START <= hour <= ContextNormalizer.OFF_HOURS_END else 0.0

        # 5. Sensitive resource
        resource = context.get("resource", "")
        factors["sensitive_resource"] = 1.0 if any(s in resource for s in ContextNormalizer.SENSITIVE_RESOURCES) else 0.0

        # 6. High request rate (placeholder — checked at middleware level)
        factors["high_request_rate"] = 0.0

        return factors

    @staticmethod
    async def _check_device(fingerprint: str, user_id: Optional[str], db: Optional[AsyncSession]) -> float:
        if not user_id or not db or fingerprint == "unknown":
            return 0.5
        try:
            result = await db.execute(
                select(Device).where(
                    Device.user_id == user_id,
                    Device.fingerprint == fingerprint,
                )
            )
            device = result.scalar_one_or_none()
            if device and device.is_trusted:
                return 0.0
            elif device:
                return 0.3
            return 1.0  # Unknown device
        except Exception:
            return 0.5

    @staticmethod
    async def _check_location(country: str, db: Optional[AsyncSession]) -> float:
        if country in ("Local", "Unknown"):
            return 0.2
        if not db:
            return 0.3
        try:
            result = await db.execute(
                select(RiskPolicy).where(RiskPolicy.is_active == "true").limit(1)
            )
            policy = result.scalar_one_or_none()
            if policy and policy.allowed_countries:
                allowed = [c.strip() for c in policy.allowed_countries.split(",") if c.strip()]
                if allowed and country not in allowed:
                    return 1.0
            return 0.0
        except Exception:
            return 0.3
