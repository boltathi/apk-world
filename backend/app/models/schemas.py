"""Marshmallow schemas for request validation."""
from marshmallow import Schema, fields, pre_load
from slugify import slugify


class ArticleCreateSchema(Schema):
    title = fields.Str(required=True)
    slug = fields.Str()
    content = fields.Str(required=True)
    excerpt = fields.Str(load_default="")
    category = fields.Str(load_default="ai-security")
    tags = fields.List(fields.Str(), load_default=[])
    status = fields.Str(load_default="draft")
    is_featured = fields.Bool(load_default=False)
    author = fields.Str(load_default="")
    difficulty = fields.Str(load_default="beginner")
    meta_title = fields.Str(load_default="")
    meta_description = fields.Str(load_default="")
    featured_image = fields.Str(load_default="")

    @pre_load
    def normalize_fields(self, data, **kwargs):
        if "featured" in data:
            data["is_featured"] = data.pop("featured")
        if "published" in data:
            data["status"] = "published" if data.pop("published") else "draft"
        if "og_image" in data:
            data["featured_image"] = data.pop("og_image")
        if "title" in data and "slug" not in data:
            data["slug"] = slugify(data["title"])
        # Validate difficulty
        valid_difficulties = ("beginner", "intermediate", "advanced")
        if data.get("difficulty") and data["difficulty"] not in valid_difficulties:
            data["difficulty"] = "beginner"
        return data


class ArticleUpdateSchema(Schema):
    title = fields.Str()
    slug = fields.Str()
    content = fields.Str()
    excerpt = fields.Str()
    category = fields.Str()
    tags = fields.List(fields.Str())
    status = fields.Str()
    is_featured = fields.Bool()
    author = fields.Str()
    difficulty = fields.Str()
    meta_title = fields.Str()
    meta_description = fields.Str()
    featured_image = fields.Str()

    @pre_load
    def normalize_fields(self, data, **kwargs):
        if "featured" in data:
            data["is_featured"] = data.pop("featured")
        if "published" in data:
            data["status"] = "published" if data.pop("published") else "draft"
        if "og_image" in data:
            data["featured_image"] = data.pop("og_image")
        if "title" in data:
            data["slug"] = slugify(data["title"])
        return data


class ArticleResponseSchema(Schema):
    id = fields.Str()
    title = fields.Str()
    slug = fields.Str()
    content = fields.Str()
    excerpt = fields.Str()
    category = fields.Str()
    tags = fields.List(fields.Str())
    status = fields.Str()
    is_featured = fields.Bool()
    views = fields.Int()
    author = fields.Str()
    difficulty = fields.Str()
    meta_title = fields.Str()
    meta_description = fields.Str()
    featured_image = fields.Str()
    published_at = fields.Str()
    created_at = fields.Str()
    updated_at = fields.Str()
