# 🚀 Low-Cost, Ultra-Fast Production Deployment Guide — Radhna Cuisine

This guide explains how to host the **Radhna Cuisine Restaurant System** for **~$3.50 – $5 / month** total with **0ms cold starts**, **100% WebSocket reliability for kitchen display**, and **maximum speed**.

---

## Why Avoid Render Free Tier?

| Feature | Render Free Tier | Recommended VPS ($3.50–$5/mo) |
| :--- | :--- | :--- |
| **Cold Starts** | ❌ 50s+ spin-down delay after 15m inactivity | ✅ **0ms delay (Always 24/7 active)** |
| **WebSockets (KDS)** | ❌ Disconnects / drops real-time kitchen alerts | ✅ **Persistent non-stop Socket.io alerts** |
| **CPU / Bandwidth** | ❌ Heavily throttled (0.1 vCPU) | ✅ **Full 2 vCPUs & Dedicated Memory** |
| **Monthly Cost** | Free (Unusable for real restaurant) | **~$3.50 / month flat rate** |

---

## 🏆 OPTION 1: 1-Click VPS Deployment with Coolify (Recommended)

[Coolify](https://coolify.io) is a **free, open-source self-hosted alternative to Vercel/Render** that runs on your VPS. It handles automatic Git pushes, free SSL certificates, domain management, and zero cold-start hosting.

### Step 1: Get a cheap VPS
Recommended VPS providers:
- **Hetzner Cloud (CX22)**: ~€3.29/mo ($3.50/mo) — 2 vCPU, 4GB RAM (Best performance & reliability).
- **AWS Lightsail**: $3.50 to $5/mo — 1 vCPU, 1–2GB RAM.
- **DigitalOcean / Hostinger**: $4 to $6/mo.

### Step 2: Install Coolify on VPS
SSH into your VPS server and run the official 1-command installer:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Once installed, open your browser and navigate to `http://YOUR_SERVER_IP:8000`.

### Step 3: Add your GitHub Repository
1. In Coolify dashboard, select **New Project** → **Public/Private GitHub Repository**.
2. Connect this repository: `restaurant-management-system`.

### Step 4: Deploy Components
1. **Backend API**:
   - Set Build Pack to **Dockerfile** (pointing to `services/backend-api/Dockerfile`).
   - Port: `3000`.
   - Domain: `https://api.yourdomain.com`.
   - Add environment variables (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`).
2. **Customer Web (`apps/customer-web`)**:
   - Framework: **Next.js**.
   - Build command: `npm run build`.
   - Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`.
3. **Admin Web & Kitchen KDS**:
   - Framework: **Vite / Static**.
   - Set build command and publish directory `dist`.

---

## 🛠️ OPTION 2: Self-Hosted Docker Compose + Caddy on VPS

If you prefer standard SSH & Docker without a web dashboard:

### Step 1: Clone Repo on VPS
```bash
git clone https://github.com/your-username/restaurant-management-system.git
cd restaurant-management-system
```

### Step 2: Create Production `.env`
Create `.env` file in root directory:
```env
DATABASE_URL=postgresql://user:password@ep-shy-paper.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secret_jwt_key_here
JWT_REFRESH_SECRET=super_secret_refresh_key_here
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com,https://kitchen.yourdomain.com
CUSTOMER_APP_URL=https://app.yourdomain.com
```

### Step 3: Update `Caddyfile` with your domain names
Open [Caddyfile](file:///home/yash/Radhna/restaurant-management-system/Caddyfile) and replace example domains with your registered domain names.

### Step 4: Run Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Caddy will automatically provision SSL certificates for all your subdomains and proxy API/WebSockets.

---

## ⚡ OPTION 3: Hybrid Setup (VPS Backend + Free Vercel Frontends)

1. Deploy **Backend API** to VPS using Option 1 or 2 to ensure continuous Socket.io connections.
2. Deploy **Customer Web** on **Vercel**:
   - Root directory: `apps/customer-web`
   - Environment variable: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
3. Deploy **Admin Panel** & **Kitchen Display** on **Cloudflare Pages / Netlify** (Free).

---

## 🔑 Post-Deployment Database Migrations & Seeding

Run database migrations against your production database:
```bash
cd database
DATABASE_URL="your_production_neon_or_vps_db_url" npx prisma migrate deploy
DATABASE_URL="your_production_neon_or_vps_db_url" npx ts-node seed/index.ts
```

### Default Seed Credentials:
- **Admin**: `admin@restaurant.com` / `password123`
- **Chief**: `chief@restaurant.com` / `password123`

---

## 🔐 Production Security Checklist

- [ ] Update `JWT_SECRET` using `openssl rand -base64 48`
- [ ] Change default admin/chief seed passwords
- [ ] Verify CORS origins in `services/backend-api/.env`
- [ ] Ensure Socket.io WebSocket connections connect securely via `wss://`
