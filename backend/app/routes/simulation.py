"""Attack simulation routes — demos for risk engine."""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.security.dependencies import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.access_log import AccessLog

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/simulation", tags=["Simulation"])

SCENARIOS = {
    "new-device": {
        "description": "Login from an unrecognized device",
        "risk_score": 55,
        "decision": "MFA_REQUIRED",
        "device_fingerprint": "unknown-device-xyz",
        "country": "Local",
    },
    "foreign-country": {
        "description": "Login from a foreign country (North Korea)",
        "risk_score": 82,
        "decision": "DENY",
        "country": "North Korea",
        "city": "Pyongyang",
    },
    "midnight-login": {
        "description": "Login at 2 AM (off-hours access)",
        "risk_score": 45,
        "decision": "MFA_REQUIRED",
        "country": "Local",
    },
    "admin-access": {
        "description": "Non-admin attempting admin resource access",
        "risk_score": 75,
        "decision": "DENY",
        "country": "Local",
    },
    "mass-download": {
        "description": "Bulk file download detected (data exfiltration attempt)",
        "risk_score": 88,
        "decision": "DENY",
        "country": "Local",
    },
    "api-abuse": {
        "description": "Excessive API requests (brute force / DDoS pattern)",
        "risk_score": 92,
        "decision": "DENY",
        "country": "Local",
    },
}


@router.get("/scenarios")
async def list_scenarios(admin: User = Depends(require_role(UserRole.ADMIN))):
    return {
        name: {"name": name, "description": s["description"], "expected_risk": s["risk_score"], "expected_decision": s["decision"]}
        for name, s in SCENARIOS.items()
    }


@router.post("/{scenario}")
async def run_scenario(
    scenario: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    if scenario not in SCENARIOS:
        return {"error": f"Unknown scenario: {scenario}. Available: {list(SCENARIOS.keys())}"}

    s = SCENARIOS[scenario]

    # Create simulated access log
    log = AccessLog(
        user_id=user.id,
        action="SIMULATION",
        resource=f"/simulation/{scenario}",
        risk_score=s["risk_score"],
        decision=s["decision"],
        ip_address="203.0.113.42" if "foreign" in scenario else "127.0.0.1",
        device_fingerprint=s.get("device_fingerprint", "simulation-device"),
        browser="SimulatedBrowser",
        os="SimulatedOS",
        country=s.get("country", "Unknown"),
        city=s.get("city", "Unknown"),
        is_vpn="true" if scenario == "api-abuse" else "false",
        timestamp=datetime.now(IST),
    )
    db.add(log)
    await db.commit()

    return {
        "scenario": scenario,
        "description": s["description"],
        "risk_score": s["risk_score"],
        "decision": s["decision"],
        "message": f"Simulation '{scenario}' executed. Log created.",
        "simulated_log_id": log.id,
    }
