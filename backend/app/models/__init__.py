"""Model repository factory functions — backed by Redis."""
from flask import current_app
from .base import RedisRepository

_repos: dict[str, RedisRepository] = {}


def _get_repo(name: str) -> RedisRepository:
    if name not in _repos:
        from ..extensions import redis_data
        if redis_data is None:
            raise RuntimeError(
                "Redis data client not initialised. "
                "Make sure REDIS_DATA_URL is set and Redis is reachable."
            )
        _repos[name] = RedisRepository(redis_data, name)
    return _repos[name]


def get_articles_repo() -> RedisRepository:
    return _get_repo("articles")


def get_users_repo() -> RedisRepository:
    return _get_repo("users")
