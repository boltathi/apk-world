"""Application configuration."""
import os


class BaseConfig:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    DEBUG = False
    TESTING = False

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 604800))
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/5")
    REDIS_SESSION_URL = os.getenv("REDIS_SESSION_URL", "redis://localhost:6379/6")
    REDIS_RATE_LIMIT_URL = os.getenv("REDIS_RATE_LIMIT_URL", "redis://localhost:6379/7")
    REDIS_JWT_BLOCKLIST_URL = os.getenv("REDIS_JWT_BLOCKLIST_URL", "redis://localhost:6379/8")
    REDIS_DATA_URL = os.getenv("REDIS_DATA_URL", "redis://localhost:6379/9")

    # Cache
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/5")
    CACHE_DEFAULT_TIMEOUT = 300

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3001")

    # Rate Limiting
    RATELIMIT_STORAGE_URI = os.getenv("REDIS_RATE_LIMIT_URL", "redis://localhost:6379/7")
    RATELIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/hour")
    RATELIMIT_HEADERS_ENABLED = True

    # Data (kept for backward compat but no longer used for storage)
    DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"))

    # Admin — MUST be set via env vars in production
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me-in-production")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@apk-world.in")

    # JWT cookie security
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = "Lax"

    # Domain
    DOMAIN = os.getenv("DOMAIN", "apk-world.in")

    # SMTP (Gmail) for contact form
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # Gmail App Password
    CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    CACHE_TYPE = "SimpleCache"
    RATELIMIT_STORAGE_URI = "memory://"


class ProductionConfig(BaseConfig):
    pass


class TestingConfig(BaseConfig):
    TESTING = True
    CACHE_TYPE = "SimpleCache"
    RATELIMIT_ENABLED = False
    REDIS_DATA_URL = os.getenv("REDIS_DATA_URL", "redis://localhost:6379/15")


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
