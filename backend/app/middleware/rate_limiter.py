"""Rate limiter middleware (in-memory fallback when Redis unavailable)."""
import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.config import settings
from app.risk_engine.context_collector import ContextCollector

logger = logging.getLogger(__name__)

# In-memory rate tracking
_rate_store: dict[str, list[float]] = defaultdict(list)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Rate limiter: 5 requests per minute on login endpoints."""

    RATE_LIMITED_PATHS = ["/api/auth/login", "/api/auth/mfa", "/api/auth/register"]

    async def dispatch(self, request: Request, call_next):
        if not any(request.url.path.startswith(p) for p in self.RATE_LIMITED_PATHS):
            return await call_next(request)

        ip = ContextCollector.get_client_ip(request)
        key = f"rate:{ip}:{request.url.path}"
        now = time.time()
        window = settings.RATE_LIMIT_WINDOW

        # Clean old entries
        _rate_store[key] = [t for t in _rate_store[key] if now - t < window]

        if len(_rate_store[key]) >= settings.RATE_LIMIT_LOGIN:
            logger.warning("Rate limit exceeded for %s on %s", ip, request.url.path)
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": window,
                },
            )

        _rate_store[key].append(now)
        return await call_next(request)
