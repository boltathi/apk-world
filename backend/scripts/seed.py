#!/usr/bin/env python3
"""
Seed script — populates Redis with sample data.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed.py            # seed (skips if data exists)
    python scripts/seed.py --check    # show current data counts
    python scripts/seed.py --clear    # wipe DB 4 + re-seed
"""
import os
import sys
from pathlib import Path

# Add backend dir to path so we can import the app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Auto-load .env from project root
from dotenv import load_dotenv
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
    print(f"   Loaded .env from {_env_path}")

from app import create_app
from app.services.article_service import ArticleService
from app.services.auth_service import AuthService
from app.extensions import redis_data


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Sample Data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARTICLES = []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Seed Functions
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def show_status():
    """Show current data counts."""
    from app.models import get_articles_repo, get_users_repo
    print("\n📊 Current database contents (Redis DB 9):")
    print(f"   Articles:           {get_articles_repo().count()}")
    print(f"   Users:              {get_users_repo().count()}")
    print()


def clear_data():
    """Flush all data in Redis DB 9 — USE WITH CAUTION."""
    from app.models import _repos
    confirm = input("⚠️  This will DELETE all data in Redis DB 9. Type 'yes' to confirm: ")
    if confirm.strip().lower() != "yes":
        print("Aborted.")
        sys.exit(0)
    redis_data.flushdb()
    _repos.clear()
    print("🗑️  Redis DB 9 flushed.")


def seed_articles():
    """Seed articles."""
    from app.models import get_articles_repo
    repo = get_articles_repo()
    existing = repo.count()
    if existing > 0:
        print(f"   ⏭  Skipping articles ({existing} already exist)")
        return
    for data in ARTICLES:
        article = ArticleService.create(data)
        print(f"   ✅ Article: {article['title']}")


def seed_admin():
    """Ensure admin user exists."""
    AuthService.ensure_admin_exists()
    from flask import current_app
    print(f"   ✅ Admin user: {current_app.config['ADMIN_USERNAME']}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def main():
    config_name = os.getenv("FLASK_ENV", "production")
    app = create_app(config_name)

    with app.app_context():
        if "--check" in sys.argv:
            show_status()
            return

        if "--clear" in sys.argv:
            clear_data()

        print(f"\n🌱 Seeding APK World data (env={config_name})...\n")

        seed_admin()
        seed_articles()

        print()
        show_status()
        print("✅ Seeding complete!\n")


if __name__ == "__main__":
    main()
