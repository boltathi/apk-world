#!/bin/bash
# ─── APK World Deployment (Contabo) ──────────────────────────
#
# Runs alongside CyberBolt on the same server.
# Uses ports 5001 (backend) and 3001 (frontend).
# CyberBolt (5000/3000) is NEVER touched.
#
# First time:
#   git clone https://github.com/boltathi/apk-world.git /opt/apk-world
#   cp /opt/apk-world/.env.example /opt/apk-world/.env
#   nano /opt/apk-world/.env
#   chmod +x /opt/apk-world/deploy-contabo.sh
#   /opt/apk-world/deploy-contabo.sh
#
# Re-deploy:
#   cd /opt/apk-world && git pull && ./deploy-contabo.sh
#
# ──────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
ENV_FILE="$APP_DIR/.env"

# Defaults — override via .env
BACKEND_PORT=5001
FRONTEND_PORT=3001
DOMAIN="apk-world.in"

echo -e "${CYAN}🌍 APK World Deployment${NC}"
echo -e "   Directory: ${APP_DIR}"
echo ""

# ─── Load .env ────────────────────────────────────────────────
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo -e "${GREEN}   ✅ .env loaded${NC}"
else
    echo -e "${CYAN}   ℹ  No .env found, using defaults${NC}"
fi

echo -e "   Backend:  :${BACKEND_PORT}   Frontend: :${FRONTEND_PORT}"
echo -e "   Domain:   ${DOMAIN}"
echo ""

# ─── [1/4] Backend setup ─────────────────────────────────────
echo -e "${CYAN}[1/4] Setting up backend...${NC}"

cd "$BACKEND_DIR"

if [ ! -f "venv/bin/activate" ]; then
    rm -rf venv
    echo -e "   Creating Python venv..."
    python3 -m venv venv || {
        echo -e "${RED}   ❌ Failed. Run: sudo apt install python3-venv -y${NC}"
        exit 1
    }
fi

source venv/bin/activate
pip install -r requirements.txt -q
echo -e "${GREEN}   ✅ Backend ready${NC}"

# ─── [2/4] Frontend setup ────────────────────────────────────
echo -e "${CYAN}[2/4] Building frontend...${NC}"

cd "$FRONTEND_DIR"
npm install -q 2>&1 | tail -1

echo -e "   Building Next.js..."
npm run build 2>&1 | tail -5

if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}   ❌ Next.js standalone build failed${NC}"
    echo "      Try: cd $FRONTEND_DIR && npm run build"
    exit 1
fi

# Copy static assets for standalone mode
mkdir -p .next/standalone/public .next/standalone/.next
cp -r public/* .next/standalone/public/ 2>/dev/null || true
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

echo -e "${GREEN}   ✅ Frontend built${NC}"

# ─── [3/4] Nginx config ──────────────────────────────────────
echo -e "${CYAN}[3/4] Configuring Nginx...${NC}"

NGINX_CONF="/etc/nginx/sites-available/apkworld"

# Don't overwrite if Certbot has already added SSL
if [ -f "$NGINX_CONF" ] && grep -q "ssl_certificate" "$NGINX_CONF"; then
    echo -e "${GREEN}   ✅ Nginx SSL config exists (Certbot) — skipping overwrite${NC}"
else
    cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
NGINX
    echo -e "${GREEN}   ✅ Nginx config written${NC}"
fi

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/

if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo -e "${GREEN}   ✅ Nginx reloaded${NC}"
else
    echo -e "${RED}   ❌ Nginx config error:${NC}"
    nginx -t
    exit 1
fi

# ─── [4/4] Start services ────────────────────────────────────
echo -e "${CYAN}[4/4] Starting services...${NC}"

# Kill only APK World sessions — NEVER touch cyberbolt
screen -S apkworld-backend -X quit 2>/dev/null || true
screen -S apkworld-frontend -X quit 2>/dev/null || true
sleep 1

lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
sleep 1

# Start Backend (gunicorn on :5001)
screen -dmS apkworld-backend bash -c "
    cd $BACKEND_DIR && \
    source venv/bin/activate && \
    exec gunicorn wsgi:app \
        --bind 127.0.0.1:${BACKEND_PORT} \
        --workers 2 \
        --timeout 60 \
        --access-logfile /var/log/apkworld-backend.log \
        --error-logfile /var/log/apkworld-backend-error.log
"

echo -n "   Waiting for backend"
for i in {1..15}; do
    if curl -s http://127.0.0.1:${BACKEND_PORT}/api/health 2>/dev/null | grep -q "healthy"; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

HEALTH_RESP=$(curl -s http://127.0.0.1:${BACKEND_PORT}/api/health 2>/dev/null)
if echo "$HEALTH_RESP" | grep -q "healthy"; then
    echo -e "${GREEN}   ✅ Backend running  →  screen -r apkworld-backend${NC}"
else
    echo -e "${RED}   ❌ Backend failed. Response: $HEALTH_RESP${NC}"
    echo "      tail -20 /var/log/apkworld-backend-error.log"
    exit 1
fi

# Start Frontend (Next.js standalone on :3001)
screen -dmS apkworld-frontend bash -c "
    cd $FRONTEND_DIR && \
    export PORT=${FRONTEND_PORT} && \
    export HOSTNAME=0.0.0.0 && \
    node .next/standalone/server.js >> /var/log/apkworld-frontend.log 2>&1
"

echo -n "   Waiting for frontend"
for i in {1..15}; do
    if curl -s http://127.0.0.1:${FRONTEND_PORT} > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

if curl -s http://127.0.0.1:${FRONTEND_PORT} > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Frontend running →  screen -r apkworld-frontend${NC}"
else
    echo -e "${RED}   ❌ Frontend failed. Debug:${NC}"
    echo "      tail -30 /var/log/apkworld-frontend.log"
    if [ -f /var/log/apkworld-frontend.log ]; then
        echo -e "${RED}   Last 10 lines:${NC}"
        tail -10 /var/log/apkworld-frontend.log
    fi
    exit 1
fi

# ─── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 APK World is live!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "   Site:   http://${DOMAIN}"
echo "   API:    http://${DOMAIN}/api/health"
echo "   Hello:  http://${DOMAIN}/api/hello"
echo ""
echo -e "${CYAN}Screen sessions:${NC}"
echo "   screen -r apkworld-backend"
echo "   screen -r apkworld-frontend"
echo "   Ctrl+A then D to detach"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo "   tail -f /var/log/apkworld-backend.log"
echo "   tail -f /var/log/apkworld-frontend.log"
echo ""
echo -e "${CYAN}SSL (after DNS points here):${NC}"
echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
