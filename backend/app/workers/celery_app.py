"""Celery worker setup for background tasks."""
# This is a placeholder for Celery integration
# In production, configure with Redis as broker
# For now, all tasks run synchronously

import logging

logger = logging.getLogger(__name__)


class BackgroundTasks:
    """Simple background task runner (synchronous fallback)."""

    @staticmethod
    async def send_notification(user_id: str, message: str):
        logger.info("Notification for %s: %s", user_id, message)

    @staticmethod
    async def cleanup_expired_otps():
        logger.info("Cleaning up expired OTPs...")

    @staticmethod
    async def generate_daily_report():
        logger.info("Generating daily report...")
