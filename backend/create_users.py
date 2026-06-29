import asyncio
import sys
sys.path.insert(0, r'e:\RACE 2\backend')
from app.database import async_session
from app.models.user import User
from app.security.password import hash_password

async def create_users():
    async with async_session() as db:
        user1 = User(email="alice@example.com", username="alice", full_name="Alice Smith", hashed_password=hash_password("password123"))
        user2 = User(email="bob@example.com", username="bob", full_name="Bob Jones", hashed_password=hash_password("password123"))
        db.add(user1)
        db.add(user2)
        try:
            await db.commit()
            print("Successfully created test users.")
        except Exception as e:
            print(f"Users may already exist. Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_users())
