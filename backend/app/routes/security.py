"""Security monitoring routes."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.security.dependencies import require_role, get_current_user, require_risk_check, require_severe_access
from app.models.user import User, UserRole
from app.models.access_log import AccessLog

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/security", tags=["Security"])


@router.get("/logs")
async def get_logs(
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_severe_access),
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(AccessLog, User.email).outerjoin(User, AccessLog.user_id == User.id)
        .order_by(AccessLog.timestamp.desc()).offset(offset).limit(limit)
    )
    logs_data = result.all()

    count_result = await db.execute(select(func.count(AccessLog.id)))
    total = count_result.scalar() or 0

    return {
        "logs": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "user_email": email,
                "action": l.action,
                "resource": l.resource,
                "risk_score": l.risk_score,
                "decision": l.decision,
                "ip_address": l.ip_address,
                "browser": l.browser,
                "os": l.os,
                "country": l.country,
                "city": l.city,
                "is_vpn": l.is_vpn,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            }
            for l, email in logs_data
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/risk-stats")
async def get_risk_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    since = datetime.now(IST) - timedelta(days=30)
    result = await db.execute(
        select(AccessLog).where(AccessLog.timestamp >= since)
    )
    logs = list(result.scalars().all())

    total = len(logs)
    if total == 0:
        return {
            "total_requests": 0,
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0,
            "denied_count": 0,
            "mfa_triggered_count": 0,
            "avg_risk_score": 0,
            "recent_suspicious": [],
            "daily_stats": [],
        }

    high = sum(1 for l in logs if l.risk_score > 60)
    medium = sum(1 for l in logs if 30 < l.risk_score <= 60)
    low = sum(1 for l in logs if l.risk_score <= 30)
    denied = sum(1 for l in logs if l.decision == "DENY")
    mfa = sum(1 for l in logs if l.decision == "MFA_REQUIRED")
    avg = sum(l.risk_score for l in logs) / total

    # Recent suspicious (high-risk)
    suspicious = [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource": l.resource,
            "risk_score": l.risk_score,
            "decision": l.decision,
            "ip_address": l.ip_address,
            "country": l.country,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in sorted(logs, key=lambda x: x.risk_score, reverse=True)[:10]
        if l.risk_score > 30
    ]

    # Daily stats for chart
    daily = {}
    for l in logs:
        day = l.timestamp.strftime("%Y-%m-%d") if l.timestamp else "unknown"
        if day not in daily:
            daily[day] = {"date": day, "count": 0, "avg_risk": 0, "total_risk": 0}
        daily[day]["count"] += 1
        daily[day]["total_risk"] += l.risk_score

    for d in daily.values():
        d["avg_risk"] = round(d["total_risk"] / d["count"], 1) if d["count"] else 0
        del d["total_risk"]

    return {
        "total_requests": total,
        "high_risk_count": high,
        "medium_risk_count": medium,
        "low_risk_count": low,
        "denied_count": denied,
        "mfa_triggered_count": mfa,
        "avg_risk_score": round(avg, 2),
        "recent_suspicious": suspicious,
        "daily_stats": sorted(daily.values(), key=lambda x: x["date"]),
    }


@router.get("/activity")
async def get_activity(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get recent activity for the current user or all (admin)."""
    query = select(AccessLog).order_by(AccessLog.timestamp.desc())
    if user.role != UserRole.ADMIN:
        query = query.where(AccessLog.user_id == user.id)
    query = query.limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "resource": l.resource,
            "risk_score": l.risk_score,
            "decision": l.decision,
            "ip_address": l.ip_address,
            "country": l.country,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]
