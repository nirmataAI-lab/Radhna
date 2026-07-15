
# Full Improvement Rollout — 3 Panels + Cross-App

Scope is large, so I'll execute in **6 phases**. Each phase ends with a clean build across all 4 packages. I'll ship them back-to-back without stopping for approval between phases unless something needs your input (e.g. a design choice or a secret).

---

## Phase 1 — Admin Panel high-impact
- Recharts on Analytics: revenue line, top items bar, hourly heatmap
- Global ⌘K command palette (orders / menu items / customers)
- Bulk actions on Menu (multi-select → toggle availability / price update)
- Image upload for menu items (drag-drop + preview) via backend `/uploads`
- Staff & Roles CRUD UI over existing `user_roles`
- Coupon builder wizard with live preview
- Low-stock widget on Dashboard + CSV export on Orders / Revenue / Audit

## Phase 2 — Chief KDS
- Keyboard shortcuts (1–9 select, R ready, U undo, F fullscreen)
- Item-level checkoff (strike-through per item, persisted)
- Recall lane (60s undo of completed orders)
- Prep-time metrics panel (avg / slowest item today)
- Multi-station view (filter chips: grill / fryer / cold / drinks)
- Inline low-stock badge on OrderCard
- Sound customization (per-status chime + volume slider persisted)
- Formalize auto-bump escalation tiers

## Phase 3 — Customer Panel
- Realtime OrderTrack via WebSocket (replaces poll)
- Favorites + "Order again" (needs small backend `Favorite` model + endpoints)
- Menu search box + veg / spicy / price-sort filters
- Guest checkout via phone + OTP (reuses existing auth)
- PWA: manifest + service worker (network-first HTML, cache-first assets, offline menu)
- Skeleton loaders replacing spinners
- Empty-cart illustration + "Popular right now" carousel
- Address book (schema + UI in profile)

## Phase 4 — Cross-app hardening
- JWT refresh tokens + "logout everywhere"
- React ErrorBoundary on every route with toast + reset
- Nest `@nestjs/throttler` on `/auth` and `/orders`
- i18n scaffold (react-i18next, English baseline, one extra locale key set)
- Dark/light toggle in Admin (tokens already exist)

## Phase 5 — Observability & CI
- Sentry SDK wired in backend + 3 frontends (DSN via secret; skipped if not provided)
- Single GitHub Action: `tsc`, lint, backend unit tests, 4 builds

## Phase 6 — E2E
- Playwright smoke test: browse menu → place order → chief bumps → admin sees revenue

---

## Technical notes
- **Backend additions**: `Favorite` model + endpoints, `Address` model + endpoints, `/uploads` (multer + local disk, S3-ready adapter), throttler config, refresh-token rotation table, small `metrics` endpoint for prep times. Migrations are additive — no destructive schema changes.
- **Realtime**: reuse existing chief WebSocket gateway; add a `customer:order:{id}` room the customer subscribes to.
- **PWA**: `vite-plugin-pwa` in customer-web only, guarded (no SW in Lovable preview / dev, kill-switch via `?sw=off`).
- **Secrets**: I'll request `SENTRY_DSN_*` via `add_secret` only when Phase 5 starts; if you skip, Sentry init no-ops.
- **Sandbox constraint**: the NestJS backend + Postgres don't run in the Lovable preview, so I'll verify each phase via `tsc` + `vite build` across all 4 packages and read-through of the new code paths. Runtime verification happens in your local `docker compose` env.

## What I need from you now
Nothing — I'll start Phase 1 immediately after you approve this plan. If you'd rather I re-order (e.g. Customer first), reply with the phase order you want.
