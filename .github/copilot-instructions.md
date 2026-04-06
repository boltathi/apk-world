# APK World — Copilot Instructions

## Architecture Overview

APK World is a Flask + Next.js lifestyle & learning platform: **backend** (Flask :5001), **frontend** (Next.js :3001), and **Redis** (5 DBs). All data is stored in Redis (DB 9) via `RedisRepository` — no filesystem storage.

## ⚠️ CRITICAL RULE — Keep README.md Updated

**After EVERY code change**, update `README.md` in the project root to reflect:
- New files or directories added to the project structure tree
- New API endpoints added to the endpoint tables
- New features added to the features section
- New environment variables added to the env vars table
- Changes to the tech stack, architecture diagram, or deployment steps
- Updated roadmap items (mark completed with `[x]`)

This ensures `README.md` is always the single source of truth for the project.

## Backend (Flask)

- **App factory** pattern in `backend/app/__init__.py` — `create_app(config_name)` initializes extensions and registers a single API blueprint.
- **Layered architecture**: API routes (`api/v1/`) → Services (`services/`) → Repository (`models/base.py`). Never access `RedisRepository` directly from routes — always go through a service class.
- **API routes** use Flask-RESTX `Namespace`/`Resource` classes. Each namespace is registered in `api/v1/__init__.py`. Public endpoints and admin endpoints coexist in the same file (e.g., `/articles` is public, `/articles/admin` requires auth).
- **Data layer**: `RedisRepository` in `models/base.py` stores each record as a JSON string in Redis, with sorted-set indexes for ordering and set indexes for fast filtered queries. Obtain repos via factory functions in `models/__init__.py` (e.g., `get_articles_repo()`). The repo caches instances in `_repos` dict — tests must clear `_repos` between runs (see `conftest.py`).
- **Validation**: Marshmallow schemas in `models/schemas.py` with `@pre_load` hooks for auto-slug generation via `python-slugify`.
- **Auth**: JWT via `flask-jwt-extended`. Admin routes use `@admin_required()` decorator from `utils/decorators.py` which checks `role` claim. Token blocklist stored in Redis DB 8.
- **Redis databases**: DB 5 = cache, DB 6 = sessions, DB 7 = rate limits, DB 8 = JWT blocklist, DB 9 = data storage. Redis is **required** — the app cannot store data without it.
- **Content lifecycle**: Articles have `status` field (`draft`/`published`). `published_at` is auto-set on first transition to `published`. Public endpoints filter by `status="published"` by default. Articles have an optional `author` field.
- **Image upload**: `POST /api/v1/upload/image` accepts images up to 2 MB (JPEG, PNG, GIF, WebP, SVG), stores base64 in Redis as `images:<uuid>` hashes, serves via `GET /api/v1/upload/image/<id>` with immutable caching. Admin-only.
- **Swagger docs** auto-generated at `/api/v1/docs` by Flask-RESTX.

## Frontend (Next.js 15 / React 19)

- **App Router** with `src/app/` directory structure. Public pages use server-side fetching (`fetchServerAPI`), admin pages use client-side fetching (`fetchAPI`) with JWT from localStorage.
- **Two fetch functions** in `lib/api.ts`: `fetchServerAPI` (server components, uses `INTERNAL_API_URL`, revalidates at 60s in prod / 0 in dev) and `fetchAPI` (client-side, attaches Bearer token from localStorage).
- **Rich Text Editor**: TipTap WYSIWYG in `components/editor/RichTextEditor.tsx` with headings, inline formatting, lists, blockquote, code blocks (syntax-highlighted via Lowlight), links, image upload (max 2 MB to `/api/v1/upload/image`), tables, text color/highlight, alignment, undo/redo, and floating bubble menu. Images stored in Redis, served via public URL.
- **API clients** in `lib/api.ts`: `articlesAPI`, `authAPI`, `newsletterAPI`. Image uploads use direct `fetch` from the editor component.
- **State management**: Zustand store in `lib/store.ts` for auth state only. Content data is fetched per-page, not stored globally.
- **Admin panel** at `/admin/*` is fully client-side (`"use client"`). Auth guard in `admin/layout.tsx` redirects to `/admin/login` if unauthenticated. Login page uses its own layout (no sidebar).
- **SEO components** in `components/seo/JsonLd.tsx` — use `ArticleJsonLd`, `WebSiteJsonLd` for structured data. Every content page should include appropriate JSON-LD.
- **Styling**: Tailwind CSS with dark theme (bg-gray-950, text-gray-100). Use `cn()` from `lib/utils.ts` for conditional class merging (tailwind-merge). Two font variables: `--font-inter` (body) and `--font-jetbrains` (code). CSS classes: `cyber-card`, `cyber-input`, `cyber-textarea`, `cyber-btn`. Color palette uses warm amber tones (`cyber-400` = `#fbbf24`).
- **TypeScript types** in `types/index.ts` — always use these interfaces (`Article`, `PaginatedResponse<T>`) for API responses.

## Key Developer Commands

```bash
# Backend (terminal 1)
cd backend && source venv/bin/activate
FLASK_ENV=development FLASK_APP=wsgi:app flask run --port=5001

# Frontend (terminal 2)
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:5001 INTERNAL_API_URL=http://localhost:5001 npx next dev --port 3001

# Tests
cd backend && source venv/bin/activate && python -m pytest tests/ -v

# Seed data
cd backend && source venv/bin/activate && python scripts/seed.py
```

## Patterns to Follow

- **New content type**: Add repo factory in `models/__init__.py` → service class in `services/` → RESTX namespace in `api/v1/` → register namespace in `api/v1/__init__.py` → add TypeScript type in `types/index.ts` → add API client in `lib/api.ts` → **update `README.md`**.
- **New admin CRUD page**: Create `admin/<entity>/page.tsx` (list) and `admin/<entity>/[id]/page.tsx` (edit form). Use `"use client"` directive, fetch via `fetchAPI`, and follow the pattern in `admin/articles/` → **update `README.md`**.
- **Tests**: Use fixtures from `conftest.py` — `client` for unauthenticated requests, `auth_headers` for admin. Tests use `TestingConfig` (SimpleCache, rate limiting disabled, Redis DB 15 for isolation).
- **Environment config**: All env vars go through `config.py` classes with `os.getenv()` defaults. Never hardcode URLs or secrets.
