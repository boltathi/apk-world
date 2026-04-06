"""Article service — business logic for articles."""
from datetime import datetime, timezone
from ..models import get_articles_repo
from ..models.schemas import ArticleCreateSchema, ArticleUpdateSchema
from ..extensions import cache
from ..utils.sanitize import sanitize_html, sanitize_plain, sanitize_tags, sanitize_slug


class ArticleService:

    @staticmethod
    def get_all(page=1, per_page=12, category=None, tag=None, status="published", difficulty=None):
        repo = get_articles_repo()
        filters = {}
        if status:
            filters["status"] = status
        if category:
            filters["category"] = category

        articles, total = repo.find_all(
            filters=filters,
            sort_by="published_at",
            sort_desc=True,
            page=page,
            per_page=per_page,
        )

        # Filter by tag if provided
        if tag:
            articles = [a for a in articles if tag in a.get("tags", [])]
            total = len(articles)

        # Filter by difficulty if provided
        if difficulty:
            articles = [a for a in articles if a.get("difficulty", "beginner") == difficulty]
            total = len(articles)

        return articles, total

    @staticmethod
    def get_by_slug(slug: str):
        repo = get_articles_repo()
        article = repo.find_one(slug=slug, status="published")
        if article:
            # Increment views
            repo.update(article["id"], {"views": article.get("views", 0) + 1})
        return article

    @staticmethod
    def get_featured(limit=3):
        repo = get_articles_repo()
        articles, _ = repo.find_all(
            filters={"status": "published", "is_featured": True},
            sort_by="published_at",
            sort_desc=True,
            per_page=limit,
        )
        return articles

    @staticmethod
    def get_categories():
        repo = get_articles_repo()
        articles, _ = repo.find_all(filters={"status": "published"}, per_page=1000)
        cats = {}
        for a in articles:
            cat = a.get("category", "uncategorized")
            cats[cat] = cats.get(cat, 0) + 1
        return [{"name": k, "count": v} for k, v in sorted(cats.items())]

    @staticmethod
    def search(query: str, page=1, per_page=12):
        repo = get_articles_repo()
        return repo.search(query, ["title", "content", "excerpt", "tags"], page, per_page)

    @staticmethod
    def create(data: dict):
        schema = ArticleCreateSchema()
        validated = schema.load(data)
        # Sanitize user-supplied content
        validated["content"] = sanitize_html(validated.get("content", ""))
        validated["excerpt"] = sanitize_plain(validated.get("excerpt", ""), 500)
        validated["title"] = sanitize_plain(validated.get("title", ""), 200)
        validated["meta_title"] = sanitize_plain(validated.get("meta_title", ""), 200)
        validated["meta_description"] = sanitize_plain(validated.get("meta_description", ""), 500)
        if validated.get("author"):
            validated["author"] = sanitize_plain(validated["author"], 100)
        if validated.get("slug"):
            validated["slug"] = sanitize_slug(validated["slug"])
        if validated.get("tags"):
            validated["tags"] = sanitize_tags(validated["tags"])
        validated["views"] = 0
        if validated.get("status") == "published":
            validated["published_at"] = datetime.now(timezone.utc).isoformat()
        repo = get_articles_repo()
        return repo.create(validated)

    @staticmethod
    def update(article_id: str, data: dict):
        schema = ArticleUpdateSchema()
        validated = schema.load(data)
        # Sanitize user-supplied content
        if "content" in validated:
            validated["content"] = sanitize_html(validated["content"])
        if "excerpt" in validated:
            validated["excerpt"] = sanitize_plain(validated["excerpt"], 500)
        if "title" in validated:
            validated["title"] = sanitize_plain(validated["title"], 200)
        if "meta_title" in validated:
            validated["meta_title"] = sanitize_plain(validated["meta_title"], 200)
        if "meta_description" in validated:
            validated["meta_description"] = sanitize_plain(validated["meta_description"], 500)
        if "author" in validated:
            validated["author"] = sanitize_plain(validated["author"], 100)
        if "slug" in validated:
            validated["slug"] = sanitize_slug(validated["slug"])
        if "tags" in validated:
            validated["tags"] = sanitize_tags(validated["tags"])
        repo = get_articles_repo()
        existing = repo.find_by_id(article_id)
        if not existing:
            return None
        # Set published_at if transitioning to published
        if validated.get("status") == "published" and existing.get("status") != "published":
            validated["published_at"] = datetime.now(timezone.utc).isoformat()
        return repo.update(article_id, validated)

    @staticmethod
    def delete(article_id: str):
        repo = get_articles_repo()
        return repo.delete(article_id)

    @staticmethod
    def get_all_for_ai():
        """Export all published articles for AI consumption."""
        repo = get_articles_repo()
        articles, _ = repo.find_all(filters={"status": "published"}, per_page=1000)
        return articles
