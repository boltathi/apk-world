# APK World ✨

> Lifestyle, Learning & Personal Growth Platform

**[apk-world.in](https://apk-world.in)** — A content platform built with Flask + Next.js for lifestyle, finance, health, mindfulness, and personal growth articles. Features free client-side lifestyle tools with AI enhancement tips, full-text search, newsletter, admin CMS, and SEO optimizations.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                  │
│                Port 80/443 · SSL · Rate Limiting          │
├────────────────────┬─────────────────────────────────────┤
│                    │                                      │
│  ┌─────────────┐   │   ┌──────────────────────┐          │
│  │   Next.js    │   │   │      Flask API        │          │
│  │  Frontend    │   │   │   Backend (Gunicorn)  │          │
│  │  Port 3001   │   │   │   Port 5001           │          │
│  └─────────────┘   │   └──────────┬───────────┘          │
│                    │              │                        │
│                    │   ┌──────────┴───────────┐           │
│                    │   │    Redis 7            │           │
│                    │   │  5 DBs: Cache (5) ·   │           │
│                    │   │  Sessions (6) · Rate   │           │
│                    │   │  Limits (7) · JWT (8)  │           │
│                    │   │  · Data (9)            │           │
│                    │   └──────────────────────┘           │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| **Backend** | Flask 3.1, Flask-RESTX, Gunicorn 23, Marshmallow |
| **State** | Zustand 5 (client), Redis 7 (server) |
| **Storage** | Redis DB 9 — all data stored as JSON via `RedisRepository` |
| **Auth** | JWT (access 1h + refresh 7d) with token rotation, Redis blocklist (DB 8) |
| **Deployment** | Contabo VPS, Nginx, screen sessions |
| **SEO** | JSON-LD, Dynamic Sitemap, robots.txt, RSS 2.0, Dynamic OG Images, Canonical URLs |

## Features

### Content
- 📝 **Articles** — Lifestyle & personal growth articles with 10 categories, tags, search, pagination, optional author field, difficulty levels (beginner/intermediate/advanced), and social share buttons (Twitter, LinkedIn, Reddit, HN)
- 📑 **Table of Contents** — Auto-generated sticky TOC sidebar on article pages with IntersectionObserver scroll spy, only shows for articles with 3+ headings
- 🔍 **Search** — Full-text search across articles with real-time results and search bar UI
- 🎯 **Difficulty Levels** — Articles tagged as beginner, intermediate, or advanced with color-coded badges and filter support on the articles page
- 📡 **RSS Feed** — RSS 2.0 feed at `/rss.xml` with Atom self-link and 1-hour caching
- 📩 **Newsletter Signup** — Email subscription form (inline variant at end of articles + compact footer variant), backed by Redis storage with rate limiting and duplicate detection
- 🖼️ **Dynamic OG Images** — Auto-generated Open Graph images at `/og/[slug]` via Next.js `ImageResponse` (edge runtime, 1200×630) with category badge, title, and branding
- 🔗 **Canonical URLs** — Proper `rel="canonical"` and Twitter card metadata on all article pages
- 📋 **Code Copy Button** — One-click copy button on all code blocks in articles, with visual feedback
- 🔀 **Related Articles** — Auto-suggested related articles at the bottom of each article page, based on category with fallback to latest
- 🤖 **Download JSON for LLM** — One-click download of any article as clean JSON (title, content as plaintext, metadata). Feed into ChatGPT, Claude, or any LLM for summaries, analysis, or study notes

### Lifestyle Tools
- 🧮 **BMI Calculator** — Public tool at `/tools/bmi-calculator`. Calculate Body Mass Index with metric/imperial toggle, color-coded results (Underweight/Normal/Overweight/Obese), visual BMI scale bar, localStorage calculation history, and AI tips for personalized health guidance
- ⏱️ **Pomodoro Timer** — Public tool at `/tools/pomodoro-timer`. Circular countdown timer with configurable work/break durations (default 25/5 min), browser notifications, session counter, daily stats tracking, 14-day history, all-time stats, and AI tips for task breakdown
- 🧰 **Tools Index** — Landing page at `/tools` listing all available lifestyle tools with descriptions and AI enhancement tips

> **AI-Enhanced Tools** — Every tool includes an "🤖 AI Tip" card suggesting how to extend your results using ChatGPT, Claude, or any AI assistant. Tools are 100% client-side (no backend, no sign-up) with localStorage persistence.

### Admin Panel
- 🔐 **Authentication** — JWT-based login with admin role
- 📊 **Dashboard** — Content statistics and quick actions
- ✏️ **CRUD** — Full create/read/update/delete for articles with optional author field
- 📝 **Rich Text Editor** — Enterprise-grade TipTap WYSIWYG editor with headings (H1-H3), bold/italic/underline/strikethrough, text alignment, bullet & ordered lists, blockquote, inline code, code blocks with syntax highlighting (Lowlight), links, image upload (max 2 MB, stored in Redis), tables (add/remove rows/columns), text color, highlight, undo/redo, and floating bubble menu
- 🖼️ **Image Upload** — Admin-only image upload endpoint (`POST /api/v1/upload/image`). Images up to 2 MB stored as base64 in Redis, served via `GET /api/v1/upload/image/<id>` with immutable caching
- 🏷️ **SEO Fields** — Custom meta titles, descriptions, and OG images per content item

### Infrastructure
- ⚡ **Redis** — 5 databases (DB 5 cache, DB 6 sessions, DB 7 rate-limits, DB 8 JWT blocklist, DB 9 data storage)
- 🔒 **Security** — Rate limiting, CORS, HSTS, CSP headers, bcrypt, JWT auth with refresh token rotation, input sanitization (bleach), 5 MB request limit, Marshmallow validation
- 📈 **Scalable** — Gunicorn workers, standalone Next.js, horizontal scaling ready

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis 7+

### Development

```bash
# Clone
git clone https://github.com/boltathi/apk-world.git
cd apk-world

# Copy environment file
cp .env.example .env
# Edit .env with your Redis password, admin credentials, etc.

# Backend (terminal 1)
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
FLASK_ENV=development FLASK_APP=wsgi:app flask run --port=5001

# Frontend (terminal 2)
cd frontend && npm install --legacy-peer-deps
NEXT_PUBLIC_API_URL=http://localhost:5001 INTERNAL_API_URL=http://localhost:5001 npx next dev --port 3001

# Seed sample data
cd backend && source venv/bin/activate && python scripts/seed.py

# Run tests
cd backend && source venv/bin/activate && python -m pytest tests/ -v
```

### Access Points
| URL | Description |
|-----|-------------|
| `http://localhost:3001` | Frontend |
| `http://localhost:5001/api/v1/docs` | Swagger API Docs |
| `http://localhost:3001/admin` | Admin Panel |
| `http://localhost:3001/tools` | Lifestyle Tools |

### Default Admin Credentials
- **Username:** `admin`
- **Password:** Set via `ADMIN_PASSWORD` in `.env`

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/articles` | List published articles (paginated) |
| GET | `/api/v1/articles/featured` | Featured articles |
| GET | `/api/v1/articles/categories` | Article categories |
| GET | `/api/v1/articles/search?q=` | Search articles |
| GET | `/api/v1/articles/<slug>` | Get article by slug |
| POST | `/api/v1/contact` | Submit contact form |
| GET | `/api/v1/upload/image/<id>` | Serve uploaded image |
| POST | `/api/v1/newsletter/subscribe` | Subscribe to newsletter |
| GET | `/api/v1/newsletter/unsubscribe` | Unsubscribe (token-verified) |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (returns access + refresh JWT) |
| POST | `/api/v1/auth/refresh` | Refresh tokens (rotates refresh token) |
| DELETE | `/api/v1/auth/logout` | Logout (blocklists both tokens) |
| GET | `/api/v1/auth/me` | Current user info |

### Admin (Requires JWT + admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles/admin` | List all articles (inc. drafts) |
| POST | `/api/v1/articles/admin` | Create article |
| PUT | `/api/v1/articles/admin/<id>` | Update article |
| DELETE | `/api/v1/articles/admin/<id>` | Delete article |
| POST | `/api/v1/upload/image` | Upload image (max 2 MB) |
| GET | `/api/v1/newsletter/admin/subscribers` | List newsletter subscribers |
| POST | `/api/v1/newsletter/admin/send` | Send newsletter to all subscribers |

## Deployment (Contabo VPS)

### Server Requirements
- **Minimum**: 4 vCPU, 8 GB RAM, 50 GB disk
- **OS**: Ubuntu 22.04

### Deploy Steps
```bash
# 1. SSH into VPS
ssh root@YOUR_VPS_IP

# 2. Clone repo
git clone https://github.com/boltathi/apk-world.git /opt/apkworld

# 3. Create .env
cp /opt/apkworld/.env.example /opt/apkworld/.env
nano /opt/apkworld/.env

# 4. Deploy everything
chmod +x /opt/apkworld/deploy-contabo.sh
/opt/apkworld/deploy-contabo.sh

# 5. SSL (after DNS)
certbot --nginx -d apk-world.in -d www.apk-world.in
```

### Re-deploy After Code Changes
```bash
cd /opt/apkworld && git pull && ./deploy-contabo.sh
```

### DNS Configuration
| Type | Name | Value |
|------|------|-------|
| A | `apk-world.in` | `YOUR_VPS_IP` |
| A | `www.apk-world.in` | `YOUR_VPS_IP` |

## Project Structure

```
apk-world/
├── .github/
│   └── copilot-instructions.md  # AI coding assistant context
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory (create_app)
│   │   ├── config.py            # Config classes (Dev/Prod/Test)
│   │   ├── extensions.py        # Flask extensions init
│   │   ├── models/
│   │   │   ├── base.py          # RedisRepository (JSON + sorted sets)
│   │   │   ├── __init__.py      # Repo factories (get_articles_repo, etc.)
│   │   │   └── schemas.py       # Marshmallow validation schemas
│   │   ├── services/
│   │   │   ├── auth_service.py      # JWT auth + admin bootstrap
│   │   │   ├── article_service.py   # Article CRUD + search
│   │   │   └── newsletter_service.py # Newsletter send + unsubscribe tokens
│   │   ├── api/v1/
│   │   │   ├── __init__.py      # Blueprint + namespace registration
│   │   │   ├── health.py        # GET /health
│   │   │   ├── auth.py          # Login/logout/refresh/me
│   │   │   ├── articles.py      # Public + admin article endpoints
│   │   │   ├── upload.py        # Image upload/serve (Redis-stored)
│   │   │   ├── contact.py       # Contact form (SMTP)
│   │   │   └── newsletter.py    # Newsletter subscribe/unsubscribe/admin send
│   │   └── utils/
│   │       ├── decorators.py    # @admin_required()
│   │       └── sanitize.py      # HTML/input sanitization
│   ├── scripts/seed.py          # Admin user seeder
│   ├── tests/
│   │   ├── conftest.py          # Fixtures (client, auth_headers)
│   │   └── test_api.py          # API integration tests
│   ├── requirements.txt
│   └── wsgi.py                  # Gunicorn entry point
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout (Header/Footer)
│   │   │   ├── page.tsx             # Home page
│   │   │   ├── not-found.tsx        # 404 page
│   │   │   ├── robots.ts            # robots.txt generator
│   │   │   ├── sitemap.ts           # Sitemap generator
│   │   │   ├── about/
│   │   │   │   ├── page.tsx           # About page (team, stats, values, FAQ)
│   │   │   │   ├── AboutStats.tsx     # Stats bar component
│   │   │   │   └── FaqAccordion.tsx   # Client-side FAQ accordion
│   │   │   ├── contact/page.tsx     # Contact form
│   │   │   ├── newsletter/
│   │   │   │   └── unsubscribe/page.tsx # Public unsubscribe page
│   │   │   ├── articles/
│   │   │   │   ├── page.tsx         # Article list + search + filters
│   │   │   │   └── [slug]/page.tsx  # Article detail page
│   │   │   ├── og/[slug]/route.tsx  # Dynamic OG image generation (edge)
│   │   │   ├── rss.xml/route.ts     # RSS 2.0 feed
│   │   │   ├── tools/
│   │   │   │   ├── page.tsx                   # Tools index (2 tools)
│   │   │   │   ├── bmi-calculator/page.tsx    # BMI Calculator
│   │   │   │   └── pomodoro-timer/page.tsx    # Pomodoro Timer
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx       # Admin shell + auth guard
│   │   │   │   ├── page.tsx         # Dashboard
│   │   │   │   ├── login/
│   │   │   │   │   ├── layout.tsx   # Login layout (no sidebar)
│   │   │   │   │   └── page.tsx     # Login page
│   │   │   │   ├── articles/
│   │   │   │   │   ├── page.tsx     # Article list (admin)
│   │   │   │   │   └── [id]/page.tsx # Article editor
│   │   │   │   └── newsletter/page.tsx # Newsletter compose + subscriber list
│   │   ├── components/
│   │   │   ├── article/
│   │   │   │   ├── ShareButtons.tsx     # Social share (Twitter, LinkedIn, Reddit, HN, copy)
│   │   │   │   ├── TableOfContents.tsx  # Sticky TOC with scroll spy
│   │   │   │   ├── NewsletterCTA.tsx    # Newsletter signup (inline + footer)
│   │   │   │   ├── CodeCopyButton.tsx   # Copy button for code blocks
│   │   │   │   ├── RelatedArticles.tsx  # Related articles suggestions
│   │   │   │   └── DownloadArticleJson.tsx # Download article as JSON for LLM
│   │   │   ├── editor/
│   │   │   │   └── RichTextEditor.tsx # TipTap WYSIWYG editor + image upload
│   │   │   ├── ui/
│   │   │   │   └── CopyLinkButton.tsx # Copy-to-clipboard button
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx       # Nav bar (5 links incl. Tools)
│   │   │   │   └── Footer.tsx       # Site footer (newsletter, RSS)
│   │   │   └── seo/
│   │   │       └── JsonLd.tsx       # Structured data components
│   │   ├── lib/
│   │   │   ├── api.ts           # fetchAPI, fetchServerAPI, all API clients
│   │   │   ├── store.ts         # Zustand auth store
│   │   │   └── utils.ts         # cn(), CATEGORIES (10), readingTime(), utilities
│   │   └── types/
│   │       └── index.ts         # TypeScript interfaces
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── site.conf                    # Project-specific config (ports, name, emoji)
├── deploy-contabo.sh            # Unified deployment script (reads site.conf)
├── backups/                     # Redis RDB + JSON backups (gitignored)
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `dev-secret-key-change-me` |
| `JWT_SECRET_KEY` | JWT signing key | `jwt-secret-change-me` |
| `ADMIN_USERNAME` | Admin login | `admin` |
| `ADMIN_PASSWORD` | Admin password | `change-me-in-production` |
| `REDIS_URL` | Redis cache (DB 5) | `redis://localhost:6379/5` |
| `REDIS_DATA_URL` | Redis data store (DB 9) | `redis://localhost:6379/9` |
| `REDIS_JWT_BLOCKLIST_URL` | JWT blocklist (DB 8) | `redis://localhost:6379/8` |
| `DOMAIN` | Site domain | `apk-world.in` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Frontend → backend URL | `http://localhost:5001` |
| `INTERNAL_API_URL` | Server-side → backend URL | `http://localhost:5001` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://apk-world.in` |
| `SMTP_USER` | Gmail address for contact | (empty) |
| `SMTP_PASSWORD` | Gmail app password | (empty) |
| `CONTACT_EMAIL` | Recipient for contact form | (empty) |

## Redis Database Layout

| DB | Purpose |
|----|---------|
| 5 | Cache |
| 6 | Sessions |
| 7 | Rate limits |
| 8 | JWT blocklist |
| 9 | Data storage (articles, users, images, newsletters) |
| 15 | Testing (isolated) |

## Roadmap

- [x] Articles with 10 lifestyle categories
- [x] Article search with search bar UI
- [x] Enterprise TipTap WYSIWYG editor with image upload
- [x] Image upload stored in Redis (max 2 MB)
- [x] Optional author field on articles
- [x] Difficulty levels on articles (beginner/intermediate/advanced)
- [x] RSS 2.0 feed (`/rss.xml`)
- [x] Active nav highlighting with `usePathname`
- [x] About page (team, stats bar, values, FAQ accordion, structured data)
- [x] Social share buttons (Twitter, LinkedIn, Reddit, HN)
- [x] Table of Contents sidebar with scroll spy
- [x] Newsletter signup (inline + footer, Redis backend)
- [x] Newsletter admin panel (compose, send, subscriber list, unsubscribe)
- [x] Dynamic OG image generation (edge runtime)
- [x] Canonical URLs and Twitter card metadata
- [x] Code copy button on all code blocks
- [x] Related articles section on article pages
- [x] Download article as JSON for LLM consumption
- [x] JWT security hardening (refresh token rotation, dual blocklisting, 7d refresh TTL)
- [x] Contact form with SMTP
- [x] Unified deployment script (`site.conf` + shared `deploy-contabo.sh`)
- [x] Tools index page
- [x] BMI Calculator (metric/imperial, history, AI tips)
- [x] Pomodoro Timer (configurable, notifications, daily stats, AI tips)
- [ ] Comments system
- [ ] Analytics dashboard
- [ ] CI/CD pipeline (GitHub Actions)

## License

MIT © APK World
