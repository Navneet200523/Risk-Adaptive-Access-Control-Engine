"""File storage service."""
import os
import uuid
import shutil
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import UploadFile

from app.models.file import File
from app.config import settings


class FileService:
    @staticmethod
    def _ensure_upload_dir():
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    @staticmethod
    async def upload(db: AsyncSession, file: UploadFile, owner_id: str) -> File:
        FileService._ensure_upload_dir()
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        stored_name = f"{file_id}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        db_file = File(
            id=file_id,
            filename=stored_name,
            original_name=file.filename or "untitled",
            file_path=file_path,
            file_size=len(content),
            mime_type=file.content_type,
            owner_id=owner_id,
        )
        db.add(db_file)
        await db.commit()
        await db.refresh(db_file)
        return db_file

    @staticmethod
    async def get_user_files(db: AsyncSession, user_id: str) -> list[File]:
        result = await db.execute(
            select(File).where(
                and_(File.owner_id == user_id, File.is_deleted == False)
            ).order_by(File.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_shared_files(db: AsyncSession, user_id: str) -> list[File]:
        result = await db.execute(
            select(File).where(
                and_(File.is_shared == True, File.is_deleted == False)
            ).order_by(File.created_at.desc())
        )
        files = result.scalars().all()
        return [f for f in files if user_id in (f.shared_with or "")]

    @staticmethod
    async def get_file(db: AsyncSession, file_id: str) -> Optional[File]:
        result = await db.execute(select(File).where(File.id == file_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def rename(db: AsyncSession, file_id: str, new_name: str, user_id: str) -> File:
        f = await FileService.get_file(db, file_id)
        if not f or f.owner_id != user_id:
            raise ValueError("File not found or access denied")
        f.original_name = new_name
        f.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(f)
        return f

    @staticmethod
    async def delete(db: AsyncSession, file_id: str, user_id: str):
        f = await FileService.get_file(db, file_id)
        if not f or f.owner_id != user_id:
            raise ValueError("File not found or access denied")
        f.is_deleted = True
        await db.commit()

    @staticmethod
    async def share(db: AsyncSession, file_id: str, emails: list[str], owner_id: str) -> File:
        f = await FileService.get_file(db, file_id)
        if not f or f.owner_id != owner_id:
            raise ValueError("File not found or access denied")
        
        from app.models.user import User
        # Resolve emails to user IDs
        result = await db.execute(select(User).where(User.email.in_(emails)))
        users = result.scalars().all()
        user_ids = [u.id for u in users]
        
        if not user_ids:
            # If none of the emails match, we might want to let the user know, but for now we just continue
            pass

        f.is_shared = True
        existing = set(f.shared_with.split(",")) if f.shared_with else set()
        existing.update(user_ids)
        f.shared_with = ",".join(existing)
        await db.commit()
        await db.refresh(f)
        return f
