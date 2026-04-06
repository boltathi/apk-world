"""Newsletter service — send emails, manage subscribers, unsubscribe tokens."""
import hashlib
import hmac
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app

from ..extensions import redis_data


def _get_secret():
    """Get the signing secret for unsubscribe tokens."""
    return current_app.config.get("SECRET_KEY", "fallback-secret")


def generate_unsubscribe_token(email: str) -> str:
    """Create an HMAC token for a given email (deterministic, no expiry)."""
    return hmac.new(
        _get_secret().encode(), email.lower().encode(), hashlib.sha256
    ).hexdigest()[:32]


def verify_unsubscribe_token(email: str, token: str) -> bool:
    """Verify that the token matches the email."""
    expected = generate_unsubscribe_token(email)
    return hmac.compare_digest(expected, token)


def get_subscribers() -> list[dict]:
    """Return all active subscribers with metadata."""
    if not redis_data:
        return []

    emails = redis_data.smembers("newsletter:subscribers") or set()
    subscribers = []
    for email in sorted(emails):
        meta = redis_data.hgetall(f"newsletter:meta:{email}") or {}
        subscribers.append({
            "email": email,
            "subscribed_at": meta.get("subscribed_at", ""),
            "status": meta.get("status", "active"),
        })
    return subscribers


def get_subscriber_count() -> int:
    """Return total subscriber count."""
    if not redis_data:
        return 0
    return redis_data.scard("newsletter:subscribers") or 0


def unsubscribe(email: str) -> bool:
    """Remove a subscriber. Returns True if they existed."""
    if not redis_data:
        return False

    email = email.strip().lower()
    existed = redis_data.srem("newsletter:subscribers", email)
    redis_data.delete(f"newsletter:meta:{email}")
    return bool(existed)


def _build_html_email(subject: str, body_html: str, email: str, domain: str) -> str:
    """Build a styled HTML newsletter with unsubscribe footer."""
    token = generate_unsubscribe_token(email)
    unsubscribe_url = f"https://{domain}/newsletter/unsubscribe?email={email}&token={token}"

    return f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.1);">
<span style="font-size:20px;font-weight:bold;color:#22d3ee;">⚡ APK World</span>
</td></tr>

<!-- Subject -->
<tr><td style="padding:32px 32px 16px;">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">{subject}</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:0 32px 32px;color:#d1d5db;font-size:15px;line-height:1.7;">
{body_html}
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 32px;">
<a href="https://{domain}/articles" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
Read Latest Articles →
</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
<p style="margin:0 0 8px;font-size:12px;color:#6b7280;">
You received this because you subscribed to APK World newsletter.
</p>
<a href="{unsubscribe_url}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">
Unsubscribe
</a>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def send_newsletter(subject: str, body_html: str) -> dict:
    """Send newsletter to all active subscribers. Returns stats."""
    smtp_user = current_app.config.get("SMTP_USER")
    smtp_pass = current_app.config.get("SMTP_PASSWORD")
    domain = current_app.config.get("DOMAIN", "apk-world.in")

    if not smtp_user or not smtp_pass:
        raise ValueError("SMTP not configured — set SMTP_USER and SMTP_PASSWORD")

    subscribers = get_subscribers()
    active = [s for s in subscribers if s["status"] == "active"]

    if not active:
        return {"sent": 0, "failed": 0, "total": 0}

    sent = 0
    failed = 0
    errors = []

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)

            for sub in active:
                email = sub["email"]
                try:
                    msg = MIMEMultipart("alternative")
                    msg["From"] = f"APK World <{smtp_user}>"
                    msg["To"] = email
                    msg["Subject"] = subject
                    msg["List-Unsubscribe"] = (
                        f"<https://{domain}/newsletter/unsubscribe"
                        f"?email={email}&token={generate_unsubscribe_token(email)}>"
                    )

                    html_content = _build_html_email(subject, body_html, email, domain)
                    msg.attach(MIMEText(html_content, "html"))

                    server.send_message(msg)
                    sent += 1
                except Exception as e:
                    failed += 1
                    errors.append({"email": email, "error": str(e)})
                    current_app.logger.error(f"Failed to send to {email}: {e}")

    except smtplib.SMTPAuthenticationError:
        raise ValueError("SMTP authentication failed — check SMTP_USER and SMTP_PASSWORD")
    except Exception as e:
        raise ValueError(f"SMTP connection failed: {e}")

    # Log the send
    if redis_data:
        redis_data.hset("newsletter:last_send", mapping={
            "subject": subject,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "sent": str(sent),
            "failed": str(failed),
            "total": str(len(active)),
        })

    current_app.logger.info(f"Newsletter sent: {sent}/{len(active)} delivered, {failed} failed")

    result = {"sent": sent, "failed": failed, "total": len(active)}
    if errors:
        result["errors"] = errors
    return result
