"""Request logger middleware — logs every request to AccessLog."""
import logging
from datetime import datetime, timezone, timedelta
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.database import async_session
from app.models.access_log import AccessLog
from app.risk_engine.context_collector import ContextCollector
from app.security.jwt_handler import decode_token

logger = logging.getLogger(__name__)

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Skip logging for these paths
SKIP_PATHS = ["/docs", "/openapi.json", "/redoc", "/favicon.ico", "/health"]


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if any(request.url.path.startswith(p) for p in SKIP_PATHS):
            return await call_next(request)

        # Extract user from token if available
        user_id = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            payload = decode_token(auth_header[7:])
            if payload:
                user_id = payload.get("sub")

        # Collect context
        ip = ContextCollector.get_client_ip(request)
        ua = ContextCollector.get_user_agent(request)

        response: Response = await call_next(request)

        # Determine decision and risk_score based on response status
        status_code = response.status_code
        if status_code == 403:
            decision = "DENY"
            risk_score = 75  # Role-based access denial
        elif status_code == 401:
            decision = "DENY"
            risk_score = 50  # Authentication failure
        elif status_code == 429:
            decision = "DENY"
            risk_score = 60  # Rate limit exceeded
        else:
            decision = "ALLOW"
            risk_score = 0

        # Log asynchronously
        try:
            async with async_session() as db:
                log = AccessLog(
                    user_id=user_id,
                    action=request.method,
                    resource=str(request.url.path),
                    ip_address=ip,
                    browser=ContextCollector.parse_browser(ua),
                    os=ContextCollector.parse_os(ua),
                    user_agent=ua,
                    timestamp=datetime.now(IST),
                    risk_score=risk_score,
                    decision=decision,
                )
                db.add(log)
                await db.commit()
        except Exception as e:
            logger.warning("Failed to log request: %s", e)

        return response
