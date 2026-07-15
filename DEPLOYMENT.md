# 🚀 Production Deployment Guide — Radhna Cuisine Management System

## Overview

This guide covers deploying the full restaurant management system to production:
- **Backend API**: NestJS + Prisma + PostgreSQL
- **Customer Web App**: Next.js 16
- **Admin Panel**: Vite + React
- **Chief KDS**: Vite + React
- **Database**: PostgreSQL
- **Real-time**: WebSocket (Socket.io)

---

## 1. Prerequisites

### Required Accounts
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Railway](https://railway.app) | Backend + PostgreSQL hosting | $5 credit, no card? |
| [Vercel](https://vercel.com) | Customer web app (Next.js) | ✓ Free |
| [Netlify](https://netlify.com) | Admin + Chief (static) | ✓ Free |
| [Supabase](https://supabase.com) | Alternative PostgreSQL | ✓ Free 500MB |

### Local Tools
```bash
node >= 20
npm >= 9
docker >= 24  # optional, for local DB
```

---

## 2. Environment Variables

### Backend (`services/backend-api/.env`)
```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/restaurant_db

# Required - generate a strong random key
JWT_SECRET=$(openssl rand -base64 32)

# Optional (with defaults)
PORT=3000
CORS_ORIGINS=https://your-domain.com,https://admin.your-domain.com
CUSTOMER_APP_URL=https://your-domain.com
```

### Customer Web (`apps/customer-web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

### Admin Web (`apps/admin-web/.env`)
```env
VITE_API_URL=https://api.your-domain.com/api
```

### Chief Web (`apps/chief-web/.env`)
```env
VITE_API_URL=https://api.your-domain.com/api
VITE_WS_URL=https://api.your-domain.com
```

---

## 3. Database Setup (Supabase)

### Option A: Supabase (Recommended)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection string**
3. Copy the `psql` connection string (URI format)
4. Set as `DATABASE_URL` in your backend env vars

### Option B: Railway PostgreSQL
1. Create a new project on Railway
2. Add a **PostgreSQL** plugin
3. Copy the `DATABASE_URL` from the plugin's **Connect** tab

### Run Migrations
```bash
# From your local machine:
cd database
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Seed the database (creates admin + chief users + sample data)
DATABASE_URL="your-production-url" npx ts-node seed/index.ts
```

**Default login credentials:**
- Admin: `admin@restaurant.com` / `password123`
- Chief: `chief@restaurant.com` / `password123`

---

## 4. Backend Deployment (Railway)

1. **Create a Railway project** → **Deploy from GitHub**
2. Select your repo and set the root directory to `services/backend-api`
3. Add the environment variables from step 2
4. Set the **Start Command**:
   ```bash
   npx prisma generate && node dist/main
   ```
5. Railway will auto-detect the `Dockerfile` or use the start command
6. Once deployed, note your URL: `https://backend.up.railway.app`

---

## 5. Customer Web App (Vercel)

```bash
# Option 1: Direct Vercel CLI
cd apps/customer-web
npx vercel --prod

# Option 2: Vercel Dashboard
# 1. Connect your GitHub repo
# 2. Set root directory: apps/customer-web
# 3. Add env var: NEXT_PUBLIC_API_URL
# 4. Framework preset: Next.js
```

---

## 6. Admin & Chief (Netlify)

```bash
# For Admin Panel
cd apps/admin-web
npm run build
# Deploy the dist/ folder to Netlify

# For Chief KDS
cd apps/chief-web
npm run build
# Deploy the dist/ folder to Netlify
```

### Netlify Settings (same for both):
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**: Add `VITE_API_URL` and `VITE_WS_URL`

---

## 7. Docker Compose (Self-Hosted)

If you prefer self-hosting with a VPS:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: restaurant_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./services/backend-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/restaurant_db
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: https://admin.your-domain.com,https://chief.your-domain.com
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
```

Then build and run:
```bash
docker compose up -d --build
```

---

## 8. Post-Deployment Verification Checklist

| Check | How |
|-------|-----|
| ✅ Database accessible | `curl https://api.domain.com/api` → `Hello World!` |
| ✅ Auth working | `curl -X POST https://api.domain.com/api/auth/login -d '{"email":"admin@restaurant.com","password":"password123"}'` → token |
| ✅ Menu public | `curl https://api.domain.com/api/menu/categories` → JSON array |
| ✅ Admin panel loads | Visit admin URL → Login page renders |
| ✅ Chief KDS loads | Visit chief URL → Login page renders |
| ✅ Customer menu loads | Visit customer URL → Menu with items renders |
| ✅ Order placement | Add item to cart, enter table number, place order → 200 |
| ✅ Order tracking | After placing, click "Track Order" → Status page loads |
| ✅ WebSocket secured | Connecting without JWT token should be rejected |
| ✅ CORS configured | Admin/chief/customer can all reach backend API |

---

## 9. Security Hardening (Before Production)

- [ ] **Change `password123`** — Delete the seed users and create real ones
- [ ] **Generate strong `JWT_SECRET`** — `openssl rand -base64 64`
- [ ] **Restrict CORS origins** — Only your actual domains
- [ ] **Enable HTTPS** — Railway/Vercel/Netlify provide this automatically
- [ ] **Set up database backups** — Supabase has point-in-time recovery
- [ ] **Add rate limiting** — Use `@nestjs/throttler`
- [ ] **Restrict WebSocket CORS** — Update `origin` in gateway

---

## 10. Monitoring & Maintenance

### Logs
```bash
# Railway
railway logs

# Self-hosted Docker
docker logs restaurant-backend -f
```

### Database Backups
```bash
# Supabase: Automatic (Settings → Database → Backups)
# Self-hosted:
docker exec restaurant_postgres pg_dump -U postgres restaurant_db > backup.sql
```

### Health Check
The backend exposes `GET /api` which returns `Hello World!` — use this for uptime monitoring.

---

## Quick Start (Development)

```bash
# 1. Start infrastructure
npm run docker:up

# 2. Setup database
npm run db:setup

# 3. Run all 4 apps
npm run dev
```
