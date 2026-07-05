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

## Deploy

Deploy to Vercel:

```bash
npm run build
```
