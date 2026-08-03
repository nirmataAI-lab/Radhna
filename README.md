# 🍽️ Radhna Cuisine — Enterprise Restaurant Management System

An end-to-end, multi-panel Restaurant Management System and Kitchen Display System (KDS) built for high-throughput cloud kitchens, QSRs, and dining establishments.

---

## 🏗️ Monorepo Architecture Overview

```
restaurant-management-system/
├── apps/
│   ├── customer-web/   # Next.js 16 Client Portal (Menu, Cart, Checkout, Tracking, Reviews, Profile)
│   ├── chief-web/      # Vite + React KDS Panel (Live Kitchen Display, Order Recall, Stock Manager)
│   └── admin-web/      # Vite + React Admin Operations (Dashboard, Analytics, Menu CRUD, Staff, Audit, Settings)
├── packages/
│   ├── shared-types/   # TypeScript type definitions across backend & frontends
│   ├── ui-components/  # Shared UI component library & design system
│   └── utils/          # Shared utility formatters, date, currency, & validation functions
├── services/
│   └── backend-api/    # NestJS REST & WebSocket API service
└── database/
    └── prisma/         # PostgreSQL Schema & Prisma ORM setup
```

---

## ⚡ Key Features & Capabilities

### 👤 Client Panel (`apps/customer-web`)
- **Menu Browsing & Search**: Category-based navigation, Veg/Non-Veg filter toggle, price sorting, and Today's Specials banner.
- **Cart & Checkout**: Real-time cart calculation, tax, discount coupons (`COUPON20`), takeaway/dine-in order submission.
- **Order Tracking**: Real-time status tracking (`PLACED` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
- **User Authentication**: Account Registration, Sign In, Token Refresh on `401`, Password Reset flow, Profile Management, and Order History.
- **Reviews & Ratings**: Submit star ratings and customer feedback on individual food items.

### 👨‍🍳 Chef KDS Panel (`apps/chief-web`)
- **Live Kitchen Display**: Real-time order stream with audio & visual alerts on new order arrival.
- **Order Status Advancement**: One-click status progression (`PLACED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
- **Kitchen Recall Lane**: Recall ready/completed orders back to the kitchen for adjustments or customer requests.
- **Batch Stock Management**: Manage daily ingredient availability and out-of-stock items dynamically.
- **Keyboard Shortcuts & Fullscreen**: Dedicated shortcut keys (`F` for Fullscreen, `S` for Sound, `?` for Help).

### 👨‍💼 Admin Operations Panel (`apps/admin-web`)
- **Executive Dashboard**: Real-time revenue metrics, order counts, top-selling items, and category analytics.
- **Menu & Category Management**: Dynamic CRUD operations for food categories and items with image URLs and dietary tags.
- **Staff Management**: Create, edit, suspend, or manage roles (`SUPER_ADMIN`, `CHIEF`).
- **Inventory Control**: Raw material threshold alerts, quantity tracking, and stock replenishment.
- **Coupons & Promotional Offers**: Flat and percentage discount coupon creation & usage limit enforcement.
- **Audit Logs**: Immutable system activity logging tracking all administrative actions.
- **System Settings & Broadcasts**: System-wide announcements, notification broadcasts, tax rate configs, and theme toggling (Dark/Light).

---

## ⚙️ Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **bun**: `v10.x` or higher
- **PostgreSQL**: Running locally or via Docker (`docker compose up -d`)

### 2. Install Dependencies & Build Packages
```bash
npm install
npm run db:generate
cd packages/shared-types && npm run build
cd ../ui-components && npm run build
cd ../utils && npm run build
```

### 3. Database Setup & Seeding
```bash
# Push schema & seed default admin/sample menu
npm run db:push
npm run db:seed
```

### 4. Start Development Servers
```bash
# Run all services concurrently (Backend API, Customer Web, Chef KDS, Admin Web)
npm run dev:all

# Or start individually:
npm run backend:dev   # NestJS API (http://localhost:3000/api)
npm run customer:dev  # Customer Web (http://localhost:3001)
npm run chief:dev     # Chef KDS (http://localhost:8080 or dev port)
npm run admin:dev     # Admin Panel (http://localhost:8080)
```

---

## 🔒 Security & Performance Features

- **Authentication & Role-Based Access Control (RBAC)**: JWT-based authorization with access (`15m`) and refresh (`7d`) tokens.
- **Rate Limiting & Protection**: NestJS `@nestjs/throttler` request throttling and `helmet` HTTP security headers.
- **Input Validation & Sanitization**: `class-validator` DTO pipes on all backend endpoints and strict HTML sanitization.
- **Database Optimization**: Cascading deletes (`onDelete: Cascade`) and composite database indexing on foreign key constraints.
- **Error Handling**: Centralized NestJS `AllExceptionsFilter` with Winston structured file/console logging.

---

## 🧪 Testing & Code Quality

```bash
# Run NestJS API unit test suites
cd services/backend-api && npm test

# Type check across monorepo workspaces
cd services/backend-api && npx tsc --noEmit
cd apps/admin-web && npm run build
cd apps/chief-web && npm run build
cd apps/customer-web && npm run build
```

---

## 📄 License

ISC License. Built for Enterprise Production Deployment.
