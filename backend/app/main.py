"""FastAPI main application — entry point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.middleware.request_logger import RequestLoggerMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware

# Routes
from app.routes.auth import router as auth_router
from app.routes.files import router as files_router
from app.routes.reports import router as reports_router
from app.routes.admin import router as admin_router
from app.routes.security import router as security_router
from app.routes.risk_policy import router as risk_policy_router
from app.routes.simulation import router as simulation_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    await init_db()
    logger.info("✅ Database initialized")

    # Create default admin user if none exists
    from app.database import async_session
    from sqlalchemy import select
    from app.models.user import User, UserRole
    from app.security.password import hash_password

    async with async_session() as db:
        result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
        if not result.scalar_one_or_none():
            admin = User(
                email="admin@raac.io",
                username="admin",
                full_name="System Admin",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                department="IT Security",
            )
            db.add(admin)
            # Also create demo users
            manager = User(
                email="manager@raac.io",
                username="manager",
                full_name="Jane Manager",
                hashed_password=hash_password("manager123"),
                role=UserRole.MANAGER,
                department="Engineering",
            )
            employee = User(
                email="employee@raac.io",
                username="employee",
                full_name="John Employee",
                hashed_password=hash_password("employee123"),
                role=UserRole.EMPLOYEE,
                department="Engineering",
            )
            db.add_all([manager, employee])
            await db.commit()
            logger.info("✅ Default users created (admin/manager/employee)")

        # Create default risk policy
        from app.models.risk_policy import RiskPolicy
        result = await db.execute(select(RiskPolicy).limit(1))
        if not result.scalar_one_or_none():
            policy = RiskPolicy(
                name="default",
                is_active="true",
            )
            db.add(policy)
            await db.commit()
            logger.info("✅ Default risk policy created")

    yield
    logger.info("👋 Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggerMiddleware)

# Mount routers
app.include_router(auth_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(security_router, prefix="/api")
app.include_router(risk_policy_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME}", "version": settings.APP_VERSION, "docs": "/docs"}
