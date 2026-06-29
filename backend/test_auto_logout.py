import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models.user import User, UserRole
from app.models.session import Session
from app.services.auth_service import AuthService
from app.security.dependencies import require_risk_check
from unittest.mock import MagicMock

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

async def test_auto_logout():
    print("Starting verification of auto-logout logic...")
    
    # Create engine with check_same_thread=False for SQLite testing
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        
    engine = create_async_engine(
        settings.effective_database_url,
        connect_args=connect_args
    )
    test_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with test_session() as db:
        # 1. Find a test user (admin)
        result = await db.execute(select(User).where(User.role == UserRole.ADMIN).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Error: No admin user found for testing.")
            return

        print(f"Testing with user: {user.email}")

        # 2. Create a dummy session for the user
        session = Session(
            user_id=user.id,
            refresh_token="test_refresh_token",
            device_fingerprint="test_device",
            is_active=True
        )
        db.add(session)
        await db.commit()
        print(f"Created active session for user {user.id}")

        # 3. Simulate force logout
        print("Calling AuthService.force_logout_all...")
        await AuthService.force_logout_all(db, user.id)
        
        # 4. Verify session is invalidated
        result = await db.execute(
            select(Session).where(Session.user_id == user.id, Session.is_active == True)
        )
        active_sessions = result.scalars().all()
        
        if len(active_sessions) == 0:
            print("SUCCESS: All sessions invalidated successfully.")
        else:
            print(f"FAILURE: {len(active_sessions)} sessions still active.")

if __name__ == "__main__":
    asyncio.run(test_auto_logout())
