"""Gmail SMTP email utility."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_otp_email(to_email: str, otp_code: str, username: str = "User") -> bool:
    """Send OTP email via Gmail SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.warning("SMTP not configured. OTP: %s for %s", otp_code, to_email)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 RAAC Security - Your Verification Code: {otp_code}"
        msg["From"] = f"RAAC Security <{settings.SMTP_USER}>"
        msg["To"] = to_email

        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">🛡️ RAAC Security</h1>
                    <p style="color: #94a3b8; font-size: 14px;">Risk-Adaptive Access Control</p>
                </div>
                <p style="color: #cbd5e1;">Hello <strong>{username}</strong>,</p>
                <p style="color: #94a3b8;">A verification code was requested for your account. Use the code below to complete your sign-in:</p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 16px 40px; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: white;">
                        {otp_code}
                    </div>
                </div>
                <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong>5 minutes</strong>.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px;">
                    If you didn't request this code, please ignore this email or contact your administrator.
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("OTP email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s. OTP code was: %s", to_email, str(e), otp_code)
        print(f"\n[SECURITY/DEVELOPMENT] Failed to send OTP email. Verification Code for {to_email} is: {otp_code}\n")
        return False


async def send_password_reset_email(to_email: str, otp_code: str, username: str = "User") -> bool:
    """Send password reset OTP email via Gmail SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.warning("SMTP not configured. Password reset OTP: %s for %s", otp_code, to_email)
        print(f"\n[SECURITY/DEVELOPMENT] SMTP not configured. Password Reset Code for {to_email} is: {otp_code}\n")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔑 RAAC Security - Password Reset Code: {otp_code}"
        msg["From"] = f"RAAC Security <{settings.SMTP_USER}>"
        msg["To"] = to_email

        html = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px;">
            <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 40px; border: 1px solid #334155;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">🔑 Password Reset</h1>
                    <p style="color: #94a3b8; font-size: 14px;">RAAC Security — Risk-Adaptive Access Control</p>
                </div>
                <p style="color: #cbd5e1;">Hello <strong>{username}</strong>,</p>
                <p style="color: #94a3b8;">We received a request to reset your password. Use the code below to proceed:</p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 16px 40px; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: white;">
                        {otp_code}
                    </div>
                </div>
                <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong>5 minutes</strong>.</p>
                <p style="color: #ef4444; font-size: 13px; font-weight: 600;">⚠️ If you did not request a password reset, please ignore this email and ensure your account is secure.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px;">
                    This is an automated message from RAAC Security. Do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("Password reset email sent to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send password reset email to %s: %s. OTP code was: %s", to_email, str(e), otp_code)
        print(f"\n[SECURITY/DEVELOPMENT] Failed to send password reset email. Reset Code for {to_email} is: {otp_code}\n")
        return False
