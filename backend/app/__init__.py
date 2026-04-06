"""APK World Application Factory."""
import os
from flask import Flask, jsonify
from .config import config_map
from .extensions import cache, cors, jwt, limiter, init_redis


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "production")

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["production"]))

    # ── Request body size limit (5 MB) — DoS prevention ───
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    # Initialize extensions
    cache.init_app(app)
    allowed_origins = [o.strip() for o in app.config.get("CORS_ORIGINS", "").split(",") if o.strip()]
    cors.init_app(
        app,
        origins=allowed_origins or ["http://localhost:3001"],
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"],
        allow_headers=["Content-Type", "Authorization"],
    )
    jwt.init_app(app)
    limiter.init_app(app)

    # Initialize Redis connections
    with app.app_context():
        init_redis(app)

    # Register API blueprint
    from .api.v1 import api_bp
    app.register_blueprint(api_bp)

    # ── Security headers on every response ────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; frame-ancestors 'none'"
        )
        # Remove server version disclosure
        response.headers.pop("Server", None)
        return response

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(413)
    def payload_too_large(e):
        return jsonify({"error": "Payload too large", "message": "Payload too large (max 5MB)", "max_size": "5MB"}), 413

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error", "message": "Internal server error"}), 500

    # Global handler for Marshmallow validation errors
    from marshmallow import ValidationError
    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        return jsonify({"error": "Validation failed", "message": str(e.messages)}), 400

    # JWT callbacks
    @jwt.token_in_blocklist_loader
    def check_token_blocklist(jwt_header, jwt_payload):
        from .extensions import redis_jwt
        if redis_jwt:
            jti = jwt_payload["jti"]
            return redis_jwt.get(f"blocklist:{jti}") is not None
        return False

    # Ensure admin user on startup
    with app.app_context():
        from .services.auth_service import AuthService
        AuthService.ensure_admin_exists()

    return app
