# SkyTrack — Flight Price Alerts

> Track flight prices and get notified the moment your target is reached.

SkyTrack is a **mobile-first PWA** that monitors airfare prices for multiple routes, sets target prices, and pushes real-time alerts when a deal appears. Built with a full React + Supabase stack, Stripe monetisation, and automated price-checking via cron.

**Live:** https://sky-drop-woad.vercel.app/dashboard

[![CI](https://github.com/RodrigoRP/sky-track/actions/workflows/ci.yml/badge.svg)](https://github.com/RodrigoRP/sky-track/actions/workflows/ci.yml)

---

## Features

| Area | What's included |
|------|----------------|
| **Alerts** | Create, edit, pause, delete and search flight price alerts |
| **Price Analytics** | 30-day history chart, AI trend forecast, best-price-ever badge, Deal Score |
| **Real-time sync** | Supabase Realtime — price updates appear instantly without refresh |
| **Notifications** | In-app feed + Web Push + email fallback (Resend) |
| **Onboarding** | Animated splash screen + 3 swipeable intro slides |
| **Settings** | Dark mode, currency, language (EN/PT), notification channels, stats & achievement badges |
| **PWA** | Installable, offline-capable, iOS meta tags, auto-update service worker |
| **Auth** | Supabase Auth — Google OAuth + email/password, profile editing, export/delete account |
| **Monetisation** | Freemium (5 alerts) → Premium via Stripe Checkout + webhook-driven tier update |
| **i18n** | English + Portuguese (react-i18next) |
| **Accessibility** | Semantic HTML, aria-labels, focus-visible ring |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (CSS custom properties) |
| Routing | React Router v7 |
| State | Zustand v5 with persist middleware |
| Animation | Framer Motion v12 |
| Charts | Recharts v3 |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| Payments | Stripe Checkout + webhooks |
| Push | Web Push API + VAPID (via Supabase Edge Function) |
| Email | Resend (push fallback) |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest + Testing Library (39 tests) |
| CI | GitHub Actions (lint + test + build) |
| Deploy | Vercel |

---

## Quickstart

```bash
git clone https://github.com/RodrigoRP/sky-track.git
cd sky-drop
npm install --legacy-peer-deps
npm run dev
# -> http://localhost:5173/dashboard
```

The app runs fully without any env vars — Supabase/Stripe features gracefully degrade to local prototype mode.

### Scripts

```bash
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # ESLint (0 errors required)
npm test           # Vitest unit + race-condition tests
```

---

## Project Structure

```
src/
├── components/           # AppHeader, BottomNav, Toaster, Skeleton, Onboarding, InstallPrompt
├── pages/                # Dashboard, AlertDetail, Alerts, Notifications, Settings, CreateAlert
├── store/
│   └── useAppStore.js    # Zustand store — state, actions, ID reconciliation, persist
├── hooks/
│   ├── useAuth.js        # Supabase session, Realtime sync, alert migration
│   ├── useNavDirection.js
│   ├── useToast.js
│   └── useAnimVariants.js
├── lib/
│   ├── supabase.js       # Supabase client (null when env vars absent)
│   ├── alertsApi.js      # CRUD + shape converters (rowToAlert / alertToRow)
│   └── pushNotifications.js
├── locales/              # en.json, pt.json (react-i18next)
├── data/
│   ├── mockData.js       # Seed data (used when Supabase is off)
│   └── airports.js       # 150-airport autocomplete dataset
├── test/
│   ├── store.test.js         # 15 core store action tests
│   ├── store.race.test.js    # 16 ID-reconciliation + race-condition tests
│   ├── useNavDirection.test.jsx  # 9 navigation direction tests
│   └── useAuth.test.js       # 4 auth integration tests (session, migration, profile)
└── index.css             # Design tokens (CSS vars) + Tailwind base layer
supabase/
├── migrations/           # 001_initial · 002_cron · 003_account · 004_stripe · 005_stripe_period
└── functions/            # price-check · price-check-all · send-push
│                         # create-checkout-session · stripe-webhook
api/
└── health.js             # Vercel serverless health check
```

---

## Architecture

### State management (Zustand)

- `alerts` — persisted to localStorage; synced to Supabase when logged in
- `notifications` — ephemeral (not persisted)
- `settings` — persisted to localStorage
- `pendingIds / opQueue / idMap` — transient ID-reconciliation state (not persisted)

Store uses schema versioning (`STORE_VERSION = 4`) with `migrate()` for zero-downtime upgrades.

**Critical selector rule** — always select individual values, never return an object:

```js
// Correct
const alerts = useAppStore((s) => s.alerts)
const removeAlert = useAppStore((s) => s.removeAlert)

// Breaks (white screen) — new object reference on every render
const { alerts, removeAlert } = useAppStore((s) => ({ alerts: s.alerts, removeAlert: s.removeAlert }))
```

### ID reconciliation

`addAlert` does an optimistic local insert (temp `Date.now()` ID) and syncs to Supabase in the background. Operations that arrive before the server ACK are queued (`opQueue`) and replayed with the real server ID once confirmed. `idMap` resolves stale temp IDs for operations that arrive after replacement.

### Routes

| Path | Page |
|------|------|
| `/dashboard` | Home — active alerts + best deals |
| `/create-alert` | New alert form with airport autocomplete |
| `/alert/:id` | Alert detail — chart, AI forecast, edit/pause/delete |
| `/alerts` | All alerts with search + sort |
| `/notifications` | Notification feed |
| `/settings` | Preferences, stats, badges, account |

### Design tokens

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#003178` | Brand blue |
| `--color-secondary` | `#1b6d24` | Savings/success |
| `--color-tertiary` | `#5b2500` | Urgency/warning |
| `--color-surface-*` | hierarchy | Background layers |
| `--color-glass` | rgba | Header + BottomNav glassmorphism |

Dark mode: `[data-theme="dark"]` on `<html>`, controlled from Settings.

---

## Backend (Supabase)

### Environment variables

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_VAPID_PUBLIC_KEY=BF...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
APP_URL=https://your-domain.com
```

### Database migrations

```bash
supabase db push   # applies all migrations in supabase/migrations/
```

### Cron

Price checks run every 6 hours via `pg_cron` + `price-check-all` Edge Function (batches of 5 alerts, 2 s delay between batches). Alerts from users inactive for 30 days are auto-paused daily at 03:00 UTC.

---

## Deploy

```bash
npx vercel --prod
```

`vercel.json` with SPA rewrites is included. Set the environment variables above in the Vercel dashboard.

---

## Roadmap

See [PLAN.md](./PLAN.md) — 54 etapas, all core features complete.

**Backlog:** Analytics (Posthog), Sentry integration.

## Technical notes

See [DEVNOTES.md](./DEVNOTES.md) for: onboarding reset, Zustand selector rules, Tailwind v4 layer gotchas, Framer Motion v12 constraints, store migration history.
