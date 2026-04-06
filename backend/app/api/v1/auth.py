"""Authentication endpoints."""
from flask import request, jsonify
from flask_restx import Namespace, Resource
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from ...services.auth_service import AuthService
from ...extensions import limiter, redis_jwt

ns = Namespace("auth", description="Authentication")


@ns.route("/login")
class Login(Resource):
    @limiter.limit("5/minute")
    def post(self):
        """Authenticate and get JWT tokens."""
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return {"error": "Missing or invalid JSON body"}, 400

        username = str(data.get("username", ""))[:100].strip()
        password = str(data.get("password", ""))[:200]

        if not username or not password:
            return {"error": "Username and password are required"}, 400

        user = AuthService.authenticate(username, password)
        if not user:
            return {"error": "Invalid credentials"}, 401

        additional_claims = {"role": user.get("role", "user")}
        access_token = create_access_token(identity=user["id"], additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user["id"], additional_claims=additional_claims)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user.get("email"),
                "role": user.get("role"),
            },
        }


@ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token and rotate refresh token."""
        identity = get_jwt_identity()
        claims = get_jwt()
        old_jti = claims["jti"]

        # Blocklist the old refresh token (rotation)
        if redis_jwt:
            redis_jwt.set(f"blocklist:{old_jti}", "1", ex=604800)

        additional_claims = {"role": claims.get("role", "user")}
        access_token = create_access_token(
            identity=identity,
            additional_claims=additional_claims,
        )
        refresh_token = create_refresh_token(
            identity=identity,
            additional_claims=additional_claims,
        )
        return {"access_token": access_token, "refresh_token": refresh_token}


@ns.route("/logout")
class Logout(Resource):
    @jwt_required(verify_type=False)
    def delete(self):
        """Logout — blocklist both access and refresh tokens."""
        jti = get_jwt()["jti"]
        token_type = get_jwt()["type"]
        ttl = 604800 if token_type == "refresh" else 3600
        if redis_jwt:
            redis_jwt.set(f"blocklist:{jti}", "1", ex=ttl)
        return {"message": "Successfully logged out"}


@ns.route("/me")
class Me(Resource):
    @jwt_required()
    def get(self):
        """Get current user profile."""
        user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(user_id)
        if not user:
            return {"error": "User not found"}, 404
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user.get("email"),
            "role": user.get("role"),
        }
