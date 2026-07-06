# DartScorer

Production-ready Progressive Web App for dart scoring.

## Stack

- Next.js App Router, React 19, TypeScript
- Tailwind CSS, Framer Motion
- Zustand (persisted local game state)
- Supabase (optional cloud sync)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and add Supabase credentials when ready:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Supabase Auth

1. Apply `supabase/migrations/20260705183000_initial_schema.sql` (profiles trigger + RLS).
2. In **Authentication → URL Configuration**, set:
   - **Site URL** to your app origin (e.g. `http://localhost:3000`)
   - **Redirect URLs** to include `{origin}/auth/callback`
3. Email/password sign-in is available on `/`. Successful sessions land on `/home`.
4. Protected routes require a session when env vars are set. Sign out lives under Settings → Account.

## Architecture

Feature-based modules live under `features/`:

- `cricket/` — cricket scoring engine, store, UI
- `x01/` — 301/501/701 engine, checkout helpers, UI
- `players/` — reusable player setup
- `statistics/` — local session metrics
- `settings/` — app preferences

Shared interactive dartboard SVG lives in `components/dartboard/`.

## PWA

The app is installable and caches assets for offline use in production builds.

## Deploy (Vercel)

This repo is configured for [Vercel](https://vercel.com) via `vercel.json`.

1. Import the GitHub repo `foundry360/dartos` in Vercel.
2. Use the defaults (Framework: Next.js, Build: `npm run build`, Output: automatic).
3. In **Project → Settings → Domains**, assign the production domain (e.g. `dartos.vercel.app` or your team URL).
4. In **Project → Settings → Deployment Protection**, disable protection for **Production** so the app is publicly accessible.

If you see a Vercel **404 NOT_FOUND** on `dartos.vercel.app`, the deployment exists but that domain is not linked yet—open the deployment in the Vercel dashboard and assign it to Production, or use the team URL shown on the latest successful deploy.

```bash
npm run build
```
