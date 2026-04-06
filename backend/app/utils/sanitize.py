"""HTML and input sanitization utilities — defence against stored XSS."""
import re
import bleach

# Tags allowed in article content (Markdown-style HTML subset)
ALLOWED_TAGS = [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "del",
    "a", "code", "pre", "blockquote",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "figure", "figcaption",
    "hr", "span", "div", "mark", "sub", "sup",
]

ALLOWED_ATTRIBUTES = {
    "*": ["class", "id", "style"],
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height", "loading"],
    "td": ["colspan", "rowspan", "style"],
    "th": ["colspan", "rowspan", "style"],
    "mark": ["data-color", "style"],
    "span": ["data-color", "style"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto", "data"]


def sanitize_html(html: str) -> str:
    """Sanitize HTML content, allowing only safe tags and attributes."""
    if not html:
        return ""
    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    return cleaned


def sanitize_plain(text: str, max_length: int = 500) -> str:
    """Strip ALL HTML and limit length — for excerpts, titles, etc."""
    if not text:
        return ""
    cleaned = bleach.clean(text, tags=[], strip=True)
    return cleaned[:max_length].strip()


def sanitize_slug(slug: str) -> str:
    """Allow only URL-safe characters in a slug."""
    slug = slug.lower().strip()
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug[:200]


def sanitize_tags(tags: list) -> list:
    """Sanitize a list of tag strings."""
    clean = []
    for tag in tags[:20]:  # Max 20 tags
        t = sanitize_plain(str(tag), max_length=50)
        if t:
            clean.append(t)
    return clean
