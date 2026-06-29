"""File management routes."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.security.dependencies import get_current_user
from app.models.user import User
from app.services.file_service import FileService
from app.schemas.files import FileRenameRequest, FileShareRequest
import os

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        f = await FileService.upload(db, file, user.id)
        return {
            "message": "File uploaded successfully",
            "file": {
                "id": f.id,
                "original_name": f.original_name,
                "file_size": f.file_size,
                "mime_type": f.mime_type,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_files(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    files = await FileService.get_user_files(db, user.id)
    return [
        {
            "id": f.id,
            "original_name": f.original_name,
            "file_size": f.file_size,
            "mime_type": f.mime_type,
            "is_shared": f.is_shared,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "updated_at": f.updated_at.isoformat() if f.updated_at else None,
        }
        for f in files
    ]


@router.get("/shared")
async def list_shared_files(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    files = await FileService.get_shared_files(db, user.id)
    return [
        {
            "id": f.id,
            "original_name": f.original_name,
            "file_size": f.file_size,
            "mime_type": f.mime_type,
            "owner_id": f.owner_id,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in files
    ]


from fastapi import Request
from app.risk_engine.context_collector import ContextCollector
from app.risk_engine.context_normalizer import ContextNormalizer
from app.risk_engine.scoring import RiskScorer
from app.risk_engine.decision_engine import DecisionEngine
from app.models.access_log import AccessLog

@router.get("/download/{file_id}")
async def download_file(
    request: Request,
    file_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    f = await FileService.get_file(db, file_id)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
        
    if f.owner_id != user.id and user.id not in (f.shared_with or ""):
        raise HTTPException(status_code=403, detail="Access denied")
        
    device_fingerprint = request.headers.get("X-Device-Fingerprint", "unknown")
    
    # 1. Collect Context
    context = await ContextCollector.collect(request, device_fingerprint)
    
    # 2. Normalize and Score Risk
    factors = await ContextNormalizer.normalize(context, user.id, db)
    risk_score = await RiskScorer.calculate(factors, db)
    decision = await DecisionEngine.decide(risk_score, db)
    
    # 3. Security Enforcement 
    if decision["decision"] == "DENY":
        # Log the incident
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"File Download Blocked (risk={risk_score}) for {user.email}")
        raise HTTPException(status_code=403, detail=f"Download blocked by security policy: {decision['message']}")
        
    if not os.path.exists(f.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    return FileResponse(f.file_path, filename=f.original_name, media_type=f.mime_type)


@router.put("/{file_id}/rename")
async def rename_file(
    file_id: str,
    req: FileRenameRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        f = await FileService.rename(db, file_id, req.new_name, user.id)
        return {"message": "File renamed", "original_name": f.original_name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        await FileService.delete(db, file_id, user.id)
        return {"message": "File deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{file_id}/share")
async def share_file(
    file_id: str,
    req: FileShareRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        f = await FileService.share(db, file_id, req.emails, user.id)
        return {"message": "File shared", "shared_with": f.shared_with}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
