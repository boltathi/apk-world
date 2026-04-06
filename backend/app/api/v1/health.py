"""Health check endpoint."""
from flask_restx import Namespace, Resource

ns = Namespace("health", description="Health check")


@ns.route("")
class HealthCheck(Resource):
    def get(self):
        """Health check — tests Redis connectivity."""
        from ...extensions import redis_cache, redis_data
        redis_ok = False
        data_ok = False
        try:
            if redis_cache:
                redis_ok = redis_cache.ping()
        except Exception:
            pass
        try:
            if redis_data:
                data_ok = redis_data.ping()
        except Exception:
            pass
        return {
            "status": "healthy" if data_ok else "degraded",
            "redis": "connected" if redis_ok else "disconnected",
            "storage": "connected" if data_ok else "disconnected",
        }
