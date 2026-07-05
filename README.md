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
