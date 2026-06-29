"""Risk policy configuration routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.security.dependencies import require_role, get_current_user, require_risk_check, require_severe_access
from app.models.user import User, UserRole
from app.models.risk_policy import RiskPolicy
from app.schemas.risk_policy import RiskPolicyUpdateRequest

router = APIRouter(
    prefix="/risk-policy",
    tags=["Risk Policy"],
    dependencies=[Depends(require_severe_access)]
)


@router.get("/")
async def get_policy(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(RiskPolicy).where(RiskPolicy.is_active == "true").limit(1)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        # Create default policy
        policy = RiskPolicy(
            name="default",
            weight_device_mismatch=20,
            weight_location_anomaly=20,
            weight_vpn_network=15,
            weight_off_hours=10,
            weight_sensitive_resource=25,
            weight_high_request_rate=10,
            low_threshold=30,
            high_threshold=60,
            allowed_countries="",
            device_trust_duration=720,
            is_active="true",
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)

    return {
        "id": policy.id,
        "name": policy.name,
        "weight_device_mismatch": policy.weight_device_mismatch,
        "weight_location_anomaly": policy.weight_location_anomaly,
        "weight_vpn_network": policy.weight_vpn_network,
        "weight_off_hours": policy.weight_off_hours,
        "weight_sensitive_resource": policy.weight_sensitive_resource,
        "weight_high_request_rate": policy.weight_high_request_rate,
        "low_threshold": policy.low_threshold,
        "high_threshold": policy.high_threshold,
        "allowed_countries": policy.allowed_countries,
        "device_trust_duration": policy.device_trust_duration,
        "is_active": policy.is_active,
    }


@router.put("/")
async def update_policy(
    req: RiskPolicyUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(RiskPolicy).where(RiskPolicy.is_active == "true").limit(1)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(policy, key, value)

    await db.commit()
    return {"message": "Policy updated successfully"}
