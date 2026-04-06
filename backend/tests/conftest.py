"""Pytest fixtures for APK World tests."""
import os
import pytest
from app import create_app


@pytest.fixture
def app():
    """Create test application — uses Redis DB 15 for test isolation."""
    # Use a dedicated Redis DB for testing so we can flush safely
    os.environ["FLASK_ENV"] = "testing"
    os.environ.setdefault("REDIS_DATA_URL", "redis://localhost:6379/15")

    application = create_app("testing")

    # Flush the test data DB before each test
    from app.extensions import redis_data
    if redis_data:
        redis_data.flushdb()

    yield application

    # Cleanup: flush again + clear cached repo instances
    if redis_data:
        redis_data.flushdb()
    from app.models import _repos
    _repos.clear()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client, app):
    """Get JWT auth headers for admin user."""
    with app.app_context():
        response = client.post("/api/v1/auth/login", json={
            "username": app.config["ADMIN_USERNAME"],
            "password": app.config["ADMIN_PASSWORD"],
        })
        if response.status_code == 200:
            token = response.get_json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
    return {}
