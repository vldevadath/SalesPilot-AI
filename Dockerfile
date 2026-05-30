# ── Stage 1: Build Next.js Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Final unified image ──────────────────────────────────────────────
FROM python:3.11-slim

# Install Node.js 20, nginx, and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python backend dependencies ──
RUN pip install --no-cache-dir uv
COPY backend/requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# ── Copy backend source ──
COPY backend/ ./backend/

# ── Copy built Next.js standalone output from Stage 1 ──
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# ── Copy nginx & supervisor configs ──
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Railway routes traffic to port 8080
EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
