"""API v1 Blueprint and Flask-RESTX initialization."""
from flask import Blueprint
from flask_restx import Api

api_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

api = Api(
    api_bp,
    version="1.0",
    title="APK World API",
    description="Lifestyle & Learning Platform — apk-world.in",
    doc="/docs",
)

# Register namespaces
from .health import ns as health_ns
from .auth import ns as auth_ns
from .articles import ns as articles_ns
from .contact import ns as contact_ns
from .upload import ns as upload_ns
from .newsletter import ns as newsletter_ns

api.add_namespace(health_ns)
api.add_namespace(auth_ns)
api.add_namespace(articles_ns)
api.add_namespace(contact_ns)
api.add_namespace(upload_ns)
api.add_namespace(newsletter_ns)
