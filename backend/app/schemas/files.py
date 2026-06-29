"""File operation schemas."""
from pydantic import BaseModel
from typing import Optional


class FileResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_size: int
    mime_type: Optional[str] = None
    owner_id: str
    is_shared: bool
    shared_with: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class FileRenameRequest(BaseModel):
    new_name: str


class FileShareRequest(BaseModel):
    emails: list[str]
