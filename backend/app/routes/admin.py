"""Admin routes — user management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.security.dependencies import require_role, require_risk_check, require_severe_access
from app.models.user import User, UserRole
from app.schemas.admin import CreateUserRequest
from app.security.password import hash_password

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_severe_access)]
)


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role.value,
            "department": u.department,
            "is_active": u.is_active,
            "is_locked": u.is_locked,
            "failed_login_attempts": u.failed_login_attempts,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.post("/create-user")
async def create_user(
    req: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    existing = await db.execute(select(User).where((User.email == req.email) | (User.username == req.username)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=req.email,
        username=req.username,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=UserRole(req.role) if req.role in [r.value for r in UserRole] else UserRole.EMPLOYEE,
        department=req.department,
    )
    db.add(user)
    await db.commit()
    return {"message": "User created", "user_id": user.id}


@router.delete("/delete-user/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.put("/toggle-user/{user_id}")
async def toggle_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_locked:
        user.is_locked = False
        user.failed_login_attempts = 0
        user.locked_until = None
        message = "User unlocked"
    else:
        user.is_active = not user.is_active
        user.is_locked = False
        user.failed_login_attempts = 0
        user.locked_until = None
        message = f"User {'activated' if user.is_active else 'deactivated'}"

    await db.commit()
    return {"message": message}
