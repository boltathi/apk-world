"""API integration tests."""
import json


def test_health(client):
    """Test health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"


def test_articles_empty(client):
    """Test articles list when empty."""
    response = client.get("/api/v1/articles")
    assert response.status_code == 200
    data = response.get_json()
    assert data["articles"] == []
    assert data["total"] == 0


def test_ai_llms_txt(client):
    """Test llms.txt endpoint."""
    response = client.get("/api/v1/ai/llms.txt")
    assert response.status_code == 200
    assert b"APK World" in response.data


def test_auth_login(client, app):
    """Test admin login."""
    response = client.post("/api/v1/auth/login", json={
        "username": app.config["ADMIN_USERNAME"],
        "password": app.config["ADMIN_PASSWORD"],
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data


def test_admin_article_crud(client, auth_headers):
    """Test article CRUD via admin endpoints."""
    # Create
    response = client.post("/api/v1/articles/admin", json={
        "title": "Test Article",
        "content": "<p>Test content</p>",
        "category": "ai-security",
        "status": "published",
    }, headers=auth_headers)
    assert response.status_code == 201
    article_id = response.get_json()["article"]["id"]

    # Read
    response = client.get("/api/v1/articles/admin", headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["total"] >= 1

    # Update
    response = client.put(f"/api/v1/articles/admin/{article_id}", json={
        "title": "Updated Article",
    }, headers=auth_headers)
    assert response.status_code == 200

    # Delete
    response = client.delete(f"/api/v1/articles/admin/{article_id}", headers=auth_headers)
    assert response.status_code == 200
