"""Article endpoints — public + admin CRUD."""
import math
from flask import request
from flask_restx import Namespace, Resource
from marshmallow import ValidationError
from ...services.article_service import ArticleService
from ...utils.decorators import admin_required
from ...extensions import limiter
from ...models.base import MAX_PER_PAGE

ns = Namespace("articles", description="Cybersecurity articles")


@ns.route("")
class ArticleList(Resource):
    @limiter.limit("60/minute")
    def get(self):
        """List published articles (paginated)."""
        page = max(1, request.args.get("page", 1, type=int))
        per_page = max(1, min(request.args.get("per_page", 12, type=int), MAX_PER_PAGE))
        category = request.args.get("category", "")[:50] or None
        tag = request.args.get("tag", "")[:50] or None
        difficulty = request.args.get("difficulty", "")[:20] or None
        if difficulty and difficulty not in ("beginner", "intermediate", "advanced"):
            difficulty = None

        articles, total = ArticleService.get_all(page=page, per_page=per_page, category=category, tag=tag, difficulty=difficulty)
        return {
            "articles": articles,
            "total": total,
            "page": page,
            "pages": math.ceil(total / per_page) if per_page else 1,
        }


@ns.route("/featured")
class FeaturedArticles(Resource):
    @limiter.limit("60/minute")
    def get(self):
        """Get featured articles."""
        limit = max(1, min(request.args.get("limit", 3, type=int), 10))
        articles = ArticleService.get_featured(limit)
        return {"articles": articles}


@ns.route("/categories")
class ArticleCategories(Resource):
    def get(self):
        """Get article categories with counts."""
        return {"categories": ArticleService.get_categories()}


@ns.route("/search")
class ArticleSearch(Resource):
    @limiter.limit("30/minute")
    def get(self):
        """Search articles."""
        q = request.args.get("q", "").strip()[:200]
        page = max(1, request.args.get("page", 1, type=int))
        if not q:
            return {"articles": [], "total": 0, "page": 1, "pages": 0}
        articles, total = ArticleService.search(q, page)
        return {
            "articles": articles,
            "total": total,
            "page": page,
            "pages": math.ceil(total / 12),
        }


@ns.route("/<string:slug>")
class ArticleBySlug(Resource):
    def get(self, slug):
        """Get a published article by slug."""
        article = ArticleService.get_by_slug(slug)
        if not article:
            return {"error": "Article not found"}, 404
        return {"article": article}


# ─── Admin endpoints ──────────────────────────

@ns.route("/admin")
class AdminArticleList(Resource):
    @admin_required()
    def get(self):
        """List all articles (admin, includes drafts)."""
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        articles, total = ArticleService.get_all(page=page, per_page=per_page, status=None)
        return {
            "articles": articles,
            "total": total,
            "page": page,
            "pages": math.ceil(total / per_page) if per_page else 1,
        }

    @admin_required()
    @limiter.limit("30/minute")
    def post(self):
        """Create a new article."""
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return {"error": "Missing or invalid JSON body", "message": "Missing or invalid JSON body"}, 400
        try:
            article = ArticleService.create(data)
        except ValidationError as e:
            return {"error": "Validation failed", "message": str(e.messages)}, 400
        except (ValueError, RuntimeError) as e:
            return {"error": str(e), "message": str(e)}, 400
        return {"article": article, "message": "Article created"}, 201


@ns.route("/admin/<string:article_id>")
class AdminArticleDetail(Resource):
    @admin_required()
    @limiter.limit("30/minute")
    def put(self, article_id):
        """Update an article."""
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return {"error": "Missing or invalid JSON body", "message": "Missing or invalid JSON body"}, 400
        try:
            article = ArticleService.update(article_id, data)
        except ValidationError as e:
            return {"error": "Validation failed", "message": str(e.messages)}, 400
        except (ValueError, RuntimeError) as e:
            return {"error": str(e), "message": str(e)}, 400
        if not article:
            return {"error": "Article not found", "message": "Article not found"}, 404
        return {"article": article, "message": "Article updated"}

    @admin_required()
    def delete(self, article_id):
        """Delete an article."""
        success = ArticleService.delete(article_id)
        if not success:
            return {"error": "Article not found"}, 404
        return {"message": "Article deleted"}
