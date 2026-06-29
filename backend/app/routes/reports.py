"""Reports routes."""
import io
import csv
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.security.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.access_log import AccessLog
from app.models.report import Report

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Report).order_by(Report.created_at.desc()).limit(50)
    if user.role != UserRole.ADMIN:
        query = query.where(Report.generated_by == user.id)
    result = await db.execute(query)
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "report_type": r.report_type,
            "generated_by": r.generated_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/generate")
async def generate_report(
    report_type: str = "activity",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate a report based on access logs."""
    since = datetime.now(IST) - timedelta(days=30)
    query = select(AccessLog).where(AccessLog.timestamp >= since).order_by(AccessLog.timestamp.desc()).limit(1000)
    if user.role != UserRole.ADMIN:
        query = query.where(AccessLog.user_id == user.id)
        
    result = await db.execute(query)
    logs = result.scalars().all()

    # Basic stats
    total = len(logs)
    denied = sum(1 for l in logs if l.decision == "DENY")
    mfa = sum(1 for l in logs if l.decision == "MFA_REQUIRED")
    avg_risk = sum(l.risk_score for l in logs) / total if total > 0 else 0

    report_data = {
        "total_requests": total,
        "denied_requests": denied,
        "mfa_triggered": mfa,
        "average_risk_score": round(avg_risk, 2),
        "period": "last_30_days",
    }

    report = Report(
        title=f"{report_type.title()} Report - {datetime.now(IST).strftime('%Y-%m-%d')}",
        description=f"Auto-generated {report_type} report",
        report_type=report_type,
        generated_by=user.id,
        data=json.dumps(report_data),
    )
    db.add(report)
    await db.commit()

    return {"message": "Report generated", "report": report_data}


@router.get("/export")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export access logs as CSV."""
    query = select(AccessLog).order_by(AccessLog.timestamp.desc()).limit(5000)
    if user.role != UserRole.ADMIN:
        query = query.where(AccessLog.user_id == user.id)
        
    result = await db.execute(query)
    logs = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User ID", "Action", "Resource", "Risk Score", "Decision", "IP", "Country", "City", "Browser", "OS", "Timestamp"])
    for l in logs:
        writer.writerow([
            l.id, l.user_id, l.action, l.resource, l.risk_score,
            l.decision, l.ip_address, l.country, l.city,
            l.browser, l.os, l.timestamp.isoformat() if l.timestamp else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=access_logs_{datetime.now(IST).strftime('%Y%m%d')}.csv"},
    )
