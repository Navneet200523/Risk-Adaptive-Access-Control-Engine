"""Context collection engine — extracts context from HTTP requests."""
import httpx
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import Request
from app.config import settings

logger = logging.getLogger(__name__)

# Indian Standard Time offset (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class ContextCollector:
    """Collects context data from incoming requests."""

    @staticmethod
    def get_client_ip(request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    @staticmethod
    def get_user_agent(request: Request) -> str:
        return request.headers.get("User-Agent", "unknown")

    @staticmethod
    def parse_browser(user_agent: str) -> str:
        ua = user_agent.lower()
        if "chrome" in ua and "edg" in ua:
            return "Edge"
        if "chrome" in ua:
            return "Chrome"
        if "firefox" in ua:
            return "Firefox"
        if "safari" in ua:
            return "Safari"
        if "opera" in ua or "opr" in ua:
            return "Opera"
        return "Unknown"

    @staticmethod
    def parse_os(user_agent: str) -> str:
        ua = user_agent.lower()
        if "windows" in ua:
            return "Windows"
        if "mac" in ua:
            return "macOS"
        if "linux" in ua:
            return "Linux"
        if "android" in ua:
            return "Android"
        if "iphone" in ua or "ipad" in ua:
            return "iOS"
        return "Unknown"

    @staticmethod
    async def get_geo_info(ip: str) -> dict:
        """Lookup geo info via ip-api.com."""
        if ip in ("127.0.0.1", "localhost", "unknown", "::1"):
            return {"country": "Local", "city": "Local", "isp": "Local", "proxy": False}
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{settings.GEOIP_API_URL}/{ip}?fields=status,country,city,isp,proxy")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        return {
                            "country": data.get("country", "Unknown"),
                            "city": data.get("city", "Unknown"),
                            "isp": data.get("isp", "Unknown"),
                            "proxy": data.get("proxy", False),
                        }
        except Exception as e:
            logger.warning("GeoIP lookup failed: %s", e)
        return {"country": "Unknown", "city": "Unknown", "isp": "Unknown", "proxy": False}

    @staticmethod
    async def collect(request: Request, device_fingerprint: Optional[str] = None) -> dict:
        """Collect full context from a request."""
        ip = ContextCollector.get_client_ip(request)
        user_agent = ContextCollector.get_user_agent(request)
        geo = await ContextCollector.get_geo_info(ip)

        return {
            "ip_address": ip,
            "country": geo["country"],
            "city": geo["city"],
            "isp": geo["isp"],
            "is_vpn": geo["proxy"],
            "device_fingerprint": device_fingerprint or "unknown",
            "browser": ContextCollector.parse_browser(user_agent),
            "os": ContextCollector.parse_os(user_agent),
            "user_agent": user_agent,
            "timestamp": datetime.now(IST).isoformat(),
            "hour": datetime.now(IST).hour,
            "resource": str(request.url.path),
            "method": request.method,
        }
