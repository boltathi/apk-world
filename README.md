# APK World

A minimal Flask + Next.js hello-world project deployed on Contabo VPS alongside CyberBolt.

**Domain:** `apk-world.in`

---

## Architecture

```
User → Nginx (:80/:443)
          ├── /api/*  → Gunicorn/Flask (:5001)
          └── /*      → Next.js standalone (:3001)
```

| Component | Port | Purpose |
|-----------|------|---------|
| Nginx | 80/443 | Reverse proxy, SSL |
| Gunicorn | **5001** | Flask backend |
| Next.js | **3001** | React frontend (standalone) |

> Uses ports 5001/3001 to avoid conflicts with CyberBolt (5000/3000).

---

## Project Structure

```
apk-world/
├── .env.example              # Environment config template
├── .gitignore
├── deploy-contabo.sh         # One-command deployment script
├── README.md
│
├── backend/
│   ├── app/
│   │   └── __init__.py       # Flask app factory — 2 routes
│   ├── wsgi.py               # Gunicorn entry point
│   └── requirements.txt      # flask + gunicorn
│
└── frontend/
    ├── package.json           # next + react (minimal deps)
    ├── next.config.ts         # output: "standalone"
    ├── tsconfig.json
    └── src/app/
        ├── layout.tsx         # Root layout (dark theme, no CSS framework)
        └── page.tsx           # Home page — "🌍 APK World"
```

---

## Backend

**File:** `backend/app/__init__.py`

Minimal Flask app with two endpoints:

| Endpoint | Method | Response |
|----------|--------|----------|
| `/api/health` | GET | `{"status": "healthy", "app": "apk-world"}` |
| `/api/hello` | GET | `{"message": "Hello from APK World! 🌍"}` |

**No dependencies** on Redis, databases, or external services.

**Entry point:** `backend/wsgi.py` — imports `create_app()` and exposes `app` for gunicorn.

**Dependencies:** Only `flask` and `gunicorn` (see `requirements.txt`).

---

## Frontend

**Framework:** Next.js 15 with React 19, TypeScript, standalone output.

**Pages:**

| File | Route | Description |
|------|-------|-------------|
| `src/app/page.tsx` | `/` | Hello world page with links to API endpoints |
| `src/app/layout.tsx` | — | Root layout: dark background, system font, centered content |

**Styling:** Inline styles only — no Tailwind, no CSS files. Pure minimal.

**Build:** `next build` produces `.next/standalone/server.js` which runs with plain `node`.

---

## Environment Variables

**File:** `.env.example`

```dotenv
DOMAIN=apk-world.in
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

All three have defaults in the deploy script, so `.env` is optional for basic usage.

---

## Deploy Script

**File:** `deploy-contabo.sh`

4-step automated deployment:

| Step | What it does |
|------|-------------|
| **[1/4]** | Creates Python venv, installs Flask + Gunicorn |
| **[2/4]** | Runs `npm install` + `npm run build` (Next.js standalone) |
| **[3/4]** | Writes Nginx config for `apk-world.in` → ports 5001/3001 |
| **[4/4]** | Starts gunicorn + Next.js in separate screen sessions |

**Key design — isolation from CyberBolt:**

| Resource | CyberBolt | APK World |
|----------|-----------|-----------|
| Server directory | `/opt/cyberbolt` | `/opt/apk-world` |
| Backend port | 5000 | **5001** |
| Frontend port | 3000 | **3001** |
| Screen sessions | `cyberbolt-backend`, `cyberbolt-frontend` | `apkworld-backend`, `apkworld-frontend` |
| Nginx config | `/etc/nginx/sites-available/cyberbolt` | `/etc/nginx/sites-available/apkworld` |
| Log files | `/var/log/cyberbolt-*` | `/var/log/apkworld-*` |
| Domain | `cyberbolt.in` | `apk-world.in` |

The deploy script **only** kills `apkworld-*` screens and ports 5001/3001. It never touches CyberBolt.

Nginx SSL preservation: if Certbot has already configured SSL, the script skips overwriting the Nginx config.

---

## Commands

### First-time deployment (on Contabo server)

```bash
git clone https://github.com/boltathi/apk-world.git /opt/apk-world
cp /opt/apk-world/.env.example /opt/apk-world/.env
nano /opt/apk-world/.env          # optional — defaults work
chmod +x /opt/apk-world/deploy-contabo.sh
/opt/apk-world/deploy-contabo.sh
```

### Re-deploy after code changes

```bash
cd /opt/apk-world && git pull && ./deploy-contabo.sh
```

### SSL setup (after DNS points to server)

```bash
sudo certbot --nginx -d apk-world.in -d www.apk-world.in
```

### Manage screen sessions

```bash
screen -r apkworld-backend       # View backend logs
screen -r apkworld-frontend      # View frontend logs
# Ctrl+A then D to detach

screen -S apkworld-backend -X quit    # Stop backend
screen -S apkworld-frontend -X quit   # Stop frontend
```

### View logs

```bash
tail -f /var/log/apkworld-backend.log
tail -f /var/log/apkworld-backend-error.log
tail -f /var/log/apkworld-frontend.log
```

### Test endpoints

```bash
curl http://127.0.0.1:5001/api/health
curl http://127.0.0.1:5001/api/hello
curl http://127.0.0.1:3001
```

---

## GoDaddy DNS Setup

Add these A records for `apk-world.in`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | Contabo server IP | 600 |
| A | `www` | Contabo server IP | 600 |

Same IP as `cyberbolt.in` — Nginx routes by domain name.

---

## How to Extend

### Add a new API endpoint

Edit `backend/app/__init__.py`:

```python
@app.route("/api/greet/<name>")
def greet(name):
    return jsonify({"message": f"Hello, {name}!"})
```

### Add a new page

Create `frontend/src/app/about/page.tsx`:

```tsx
export default function About() {
  return <h1>About APK World</h1>;
}
```

### Add database (Redis)

Follow the CyberBolt pattern: add `redis` to `requirements.txt`, create a config class, initialize in `create_app()`.

### Add Tailwind CSS

```bash
cd frontend
npm install tailwindcss @tailwindcss/postcss postcss autoprefixer
```

Then add `tailwind.config.ts`, `postcss.config.js`, and `globals.css` following the CyberBolt pattern.
