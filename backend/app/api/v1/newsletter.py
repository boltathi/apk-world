"""Newsletter subscription endpoint — stores emails in Redis."""
import re
from datetime import datetime, timezone
from flask import request
from flask_restx import Namespace, Resource
from ...extensions import limiter, redis_data
from ...utils.decorators import admin_required
from ...services.newsletter_service import (
    get_subscribers,
    get_subscriber_count,
    send_newsletter,
    unsubscribe,
    verify_unsubscribe_token,
)

ns = Namespace("newsletter", description="Newsletter subscriptions")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
MAX_SUBSCRIBERS = 10000


@ns.route("/subscribe")
class NewsletterSubscribe(Resource):
    @limiter.limit("5/minute")
    def post(self):
        """Subscribe an email to the newsletter."""
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return {"error": "Missing JSON body", "message": "Missing JSON body"}, 400

        email = (data.get("email") or "").strip().lower()
        if not email or not EMAIL_RE.match(email):
            return {"error": "Invalid email", "message": "Please provide a valid email address"}, 400

        if len(email) > 254:
            return {"error": "Email too long", "message": "Email address is too long"}, 400

        if not redis_data:
            return {"error": "Service unavailable", "message": "Newsletter service is temporarily unavailable"}, 503

        # Check subscriber count
        count = redis_data.scard("newsletter:subscribers")
        if count and count >= MAX_SUBSCRIBERS:
            return {"error": "Limit reached", "message": "Newsletter is currently full"}, 429

        # Check if already subscribed
        if redis_data.sismember("newsletter:subscribers", email):
            return {"message": "You're already subscribed!"}, 200

        # Add subscriber
        redis_data.sadd("newsletter:subscribers", email)
        redis_data.hset(f"newsletter:meta:{email}", mapping={
            "subscribed_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
        })

        return {"message": "Successfully subscribed! Welcome aboard."}, 201


@ns.route("/unsubscribe")
class NewsletterUnsubscribe(Resource):
    def get(self):
        """Unsubscribe via token-verified link (from email footer)."""
        email = (request.args.get("email") or "").strip().lower()
        token = request.args.get("token", "")

        if not email or not token:
            return {"error": "Missing parameters", "message": "Invalid unsubscribe link"}, 400

        if not verify_unsubscribe_token(email, token):
            return {"error": "Invalid token", "message": "This unsubscribe link is invalid or expired"}, 403

        existed = unsubscribe(email)
        if existed:
            return {"message": f"Successfully unsubscribed {email}. You won't receive any more emails."}, 200
        return {"message": "This email was not subscribed."}, 200


@ns.route("/admin/subscribers")
class NewsletterAdminSubscribers(Resource):
    @admin_required()
    def get(self):
        """List all subscribers (admin only)."""
        subscribers = get_subscribers()
        last_send = None
        if redis_data:
            last_send = redis_data.hgetall("newsletter:last_send") or None

        return {
            "subscribers": subscribers,
            "total": len(subscribers),
            "last_send": last_send,
        }, 200


@ns.route("/admin/send")
class NewsletterAdminSend(Resource):
    @admin_required()
    @limiter.limit("3/hour")
    def post(self):
        """Send newsletter to all subscribers (admin only)."""
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return {"error": "Missing JSON body", "message": "Provide subject and body"}, 400

        subject = (data.get("subject") or "").strip()
        body = (data.get("body") or "").strip()

        if not subject:
            return {"error": "Missing subject", "message": "Subject is required"}, 400
        if not body:
            return {"error": "Missing body", "message": "Email body is required"}, 400
        if len(subject) > 200:
            return {"error": "Subject too long", "message": "Subject must be under 200 characters"}, 400

        try:
            result = send_newsletter(subject, body)
            return {
                "message": f"Newsletter sent to {result['sent']}/{result['total']} subscribers",
                **result,
            }, 200
        except ValueError as e:
            return {"error": "Send failed", "message": str(e)}, 503
