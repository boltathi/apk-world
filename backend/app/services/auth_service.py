"""Authentication service."""
import bcrypt
from flask import current_app
from ..models import get_users_repo


class AuthService:
    """Handles user authentication, password hashing, and admin bootstrapping."""

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode(), hashed.encode())

    @staticmethod
    def ensure_admin_exists():
        """Create the admin user if it doesn't exist."""
        repo = get_users_repo()
        admin = repo.find_one(username=current_app.config["ADMIN_USERNAME"])
        if not admin:
            repo.create({
                "username": current_app.config["ADMIN_USERNAME"],
                "email": current_app.config["ADMIN_EMAIL"],
                "password": AuthService.hash_password(current_app.config["ADMIN_PASSWORD"]),
                "role": "admin",
            })
            current_app.logger.info("Admin user created.")

    @staticmethod
    def authenticate(username: str, password: str) -> dict | None:
        repo = get_users_repo()
        user = repo.find_one(username=username)
        if user and AuthService.verify_password(password, user["password"]):
            return user
        return None

    @staticmethod
    def get_user_by_id(user_id: str) -> dict | None:
        repo = get_users_repo()
        return repo.find_by_id(user_id)
