# VectorOS

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

### Stale UI in dev?

Turbopack can serve old bundles from `.next` after file changes (missing nav items, removed screens still visible, etc.). If localhost does not match the repo:

```bash
npm run dev:clean
```

Then hard-refresh the browser (`Cmd+Shift+R`). Use `npm run clean` to delete `.next` without starting the server.

Dev uses **Webpack** (`next dev --webpack`), not Turbopack — Turbopack’s incremental cache has been unreliable for this project. Confirm only one `next dev` is running and you’re on the port printed in the terminal.

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
3. Keep **Confirm email** enabled. For production email delivery, configure **Resend SMTP** (`npm run configure:resend-smtp` after setting `RESEND_API_KEY` and `SUPABASE_ACCESS_TOKEN` in `.env.local`). See `.env.example`.
4. Email/password sign-in is available on `/login`. Successful sessions land on `/home` (or `/subscribe` when Stripe billing is configured).
5. Protected routes require a session when env vars are set. Sign out lives under Settings → Account.

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

### Player voice clips (turn + Game On)

Production uses **Kokoro George** on a **Linux VPS** (nginx + stable subdomain). Each unique player name is synthesized once, stored in Supabase Storage, and served from CDN on every device.

**Full setup guide:** [`docs/VOICE.md`](docs/VOICE.md)  
**VPS walkthrough:** [`docs/VOICE-VPS.md`](docs/VOICE-VPS.md)

Quick checklist:

1. Run migration `supabase/migrations/20260708190000_voice_clips_storage.sql`
2. Deploy Docker stack on VPS: `services/voice-worker` → `docker compose up -d --build`
3. DNS + HTTPS: `voice.yourdomain.com` → VPS (nginx + Let's Encrypt)
4. Seed clips on VPS: `VOICE_SYNTHESIS_URL=http://localhost:8787 npm run seed-voice-clips`
5. Set Vercel env vars: `VOICE_SYNTHESIS_URL=https://voice.yourdomain.com`, `VOICE_SYNTHESIS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-george`

Local macOS dev uses built-in `say` (Daniel) automatically — production uses Kokoro via the VPS worker.

```bash
npm run build
```
