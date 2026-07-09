# Player voice announcements (turn + Game On)

DartOS calls out **player turns** and **Game On** with a single shared voice for everyone in a match. Each unique player name is synthesized **once**, stored in Supabase, and served from CDN on every device afterward.

Production uses **Kokoro `bm_george`** (British English male) running on a home PC. There are no per-request Google TTS charges for player names.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser / PWA (any subscriber device)                                  │
│                                                                         │
│  1. IndexedDB cache (per device)                                        │
│  2. Supabase Storage CDN (global, keyed by name slug)                    │
│  3. POST /api/local-say on Vercel (cache miss only)                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS (cache miss)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                                       │
│                                                                         │
│  app/api/local-say/route.ts                                             │
│    → check Supabase for existing clip                                   │
│    → call remote voice worker if missing                                │
│    → upload WAV to Supabase voice-clips bucket                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS via Cloudflare Tunnel
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Home PC (Alienware / Windows) — Docker                                 │
│                                                                         │
│  voice-worker :8787  ──POST /synthesize──►  kokoro :7860                │
│    (DartOS adapter)                         (Hangry Labs KokoroTTS)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### What runs where

| Component | Where | Role |
|-----------|-------|------|
| **Phrase text** | DartOS repo (`lib/google-tts/phrases.ts`, `lib/game-on-callouts.ts`) | Builds strings like `"JayDog, you're up."` |
| **Voice + speed** | Alien PC (`docker-compose.yml`) | Kokoro voice id and `KOKORO_SPEED` |
| **Clip storage** | Supabase `voice-clips` bucket | One WAV per name slug, global CDN |
| **Device cache** | Browser IndexedDB | Avoids re-downloading known clips |
| **Synthesis trigger** | Vercel `/api/local-say` | Only on first sight of a new name |

The Alien PC does **not** contain phrase logic. It receives plain text and returns audio.

---

## Phrases (controlled in this repo)

| Callout | Source file | Example output |
|---------|-------------|----------------|
| Player turn | `lib/google-tts/phrases.ts` → `buildPlayerTurnPhrase()` | `JayDog, you're up.` |
| Game On | `lib/game-on-callouts.ts` → `buildGameOnPhrase()` | `Game on. Jay Dog to throw.` |
| Name sanitization | `lib/google-tts/phrases.ts` → `sanitizePlayerNameForTts()` | Strips unsafe chars, max 48 chars |

Client playback pipeline: `utils/speech.ts`  
API route that uploads clips: `app/api/local-say/route.ts`  
Storage paths: `lib/voice-clips/paths.ts`

**Score clips, checkouts, game modes** (visit totals, 180, etc.) use separate pre-recorded WAV files under `public/sounds/` — not the Kokoro runtime path. See the `scripts/generate-*-clips.mjs` scripts.

### Visit totals (0–180)

Visit score callouts now use the **same Kokoro pipeline** as player turns — Supabase CDN → `/api/local-say` → voice worker. The old bundled Daniel WAVs in `public/sounds/scores/` are no longer played.

**One-time seed** (after voice worker is running):

```bash
# Set VOICE_SYNTHESIS_URL in .env.local to your Cloudflare tunnel URL
npm run seed-score-clips
```

This uploads 182 clips (`0`–`180` + `no-score`) to `voice-clips/kokoro-bm-george/scores/`.

Other fixed phrases (checkout, game-shot, killer, etc.) still use bundled Daniel WAVs until migrated the same way.

---

## Voice settings (controlled on the Alien PC)

| Setting | Location | Default |
|---------|----------|---------|
| Engine | `docker-compose.yml` → `VOICE_ENGINE` | `kokoro` |
| Voice | `KOKORO_VOICE` | `bm_george` |
| Speed | `KOKORO_SPEED` | `1.2` (range 0.5–2.0) |
| Auth token | `VOICE_SYNTHESIS_TOKEN` | optional shared secret |

Preview George at different speeds (Kokoro UI also at `http://localhost:7860` on the Alien PC):

```powershell
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":1.2}" -o test.wav
```

Hear sample voices: [Kokoro examples](https://hangry-labs.github.io/kokoroTTS/examples/)

---

## Storage layout (Supabase)

Migration: `supabase/migrations/20260708190000_voice_clips_storage.sql`

Bucket: **`voice-clips`** (public read)

Paths (profile prefix must match `NEXT_PUBLIC_VOICE_CLIP_PROFILE` on Vercel):

```
voice-clips/
  kokoro-bm-george/
    turns/
      jaydog.wav          ← "JayDog, you're up."
    game-on/
      jaydog.wav          ← "Game On - JayDog To Throw"
```

Clips are keyed by **name slug**, not user ID. `"JayDog"` and `"jaydog"` normalize to the same slug; the clip is shared across all subscribers globally.

---

## Cache layers

When a device needs audio for a player name:

1. **IndexedDB** (`utils/tts-cache.ts`) — instant replay on the same device
2. **Supabase CDN** — global cache; works even when the Alien PC is off
3. **Vercel `/api/local-say`** — checks Supabase server-side, calls worker if missing
4. **Voice worker → Kokoro** — generates WAV, uploads to Supabase

Cache invalidation uses `DANIEL_TURN_CACHE_GENERATION` in `lib/local-say/env.ts` plus the voice profile slug. Bump the generation string when changing voice, speed, or phrase wording so devices drop stale clips.

---

## Full setup (production)

### 1. Supabase

1. Run all migrations in `supabase/migrations/` (including `20260708190000_voice_clips_storage.sql`).
2. Copy **Project URL**, **anon key**, and **service_role key** from Settings → API.

### 2. Alien PC — Docker stack

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```powershell
git clone https://github.com/foundry360/dartos.git
cd dartos\services\voice-worker
docker compose up --build -d
```

This starts two containers:

- **`kokoro`** — `hangrylabs/kokorotts:v0.2` (TTS engine, internal port 7860)
- **`voice-worker`** — DartOS adapter on port **8787**

Verify:

```powershell
curl http://localhost:8787/health
# {"ok":true,"engine":"kokoro","voice":"bm_george","speed":1.2}

curl -X POST http://localhost:8787/synthesize -H "Content-Type: application/json" -d "{\"text\":\"JayDog, you're up.\"}" -o turn.wav
```

After code changes in `services/voice-worker/`, pull and rebuild:

```powershell
git pull
docker compose up --build -d
```

See also: [`services/voice-worker/README.md`](../services/voice-worker/README.md)

### 3. Cloudflare Tunnel (expose worker to Vercel)

Vercel cannot reach `localhost`. Use a free ephemeral tunnel:

1. Account: [dash.cloudflare.com](https://dash.cloudflare.com)
2. Install [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
3. Run:

```powershell
cloudflared tunnel --url http://localhost:8787
```

Copy the `https://….trycloudflare.com` URL. **This URL changes every time cloudflared restarts** — update Vercel when it does.

Optional: set `VOICE_SYNTHESIS_TOKEN` in `docker-compose.yml` and match it on Vercel.

### 4. Vercel environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Uploads clips to Storage from `/api/local-say` |
| `VOICE_SYNTHESIS_URL` | Yes | Cloudflare tunnel URL (no trailing slash) |
| `VOICE_SYNTHESIS_TOKEN` | If set on worker | Must match worker token |
| `NEXT_PUBLIC_VOICE_CLIP_PROFILE` | Yes | Must match voice, e.g. `kokoro-bm-george` |

Redeploy after changing env vars.

### 5. Keep running

- Alien PC + Docker only needed when a **new** player name appears
- After a clip exists in Supabase, all devices play from CDN even if the PC is off
- Recommended: Docker Desktop → start on login; leave cloudflared running (or use a named tunnel for a stable URL)

**Cost:** $0 for Kokoro + Cloudflare tunnel + Supabase free tier at DartOS scale. No Google API usage for player names.

---

## Local development (macOS)

On `npm run dev` on a Mac, `/api/local-say` uses **macOS `say`** with **Daniel (English UK)** at 168 wpm — not Kokoro. This is intentional for zero-setup dev.

To test the production Kokoro path locally, set in `.env.local`:

```env
VOICE_SYNTHESIS_URL=https://your-tunnel.trycloudflare.com
VOICE_SYNTHESIS_TOKEN=your-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-george
```

---

## Request flow (new player name)

1. Match starts → `utils/prefetch-scorecard-voice.ts` prefetches turn + Game On clips
2. `utils/speech.ts` checks IndexedDB → miss
3. Fetches Supabase CDN URL → miss (404)
4. POST `/api/local-say` with `{ text, storagePath }`
5. Vercel checks Supabase again → still miss
6. Vercel POST `{ text }` to `VOICE_SYNTHESIS_URL/synthesize`
7. Voice worker POST `{ text, voice, speed }` to Kokoro `/tts/generate`
8. WAV returned up the chain; Vercel uploads to Supabase
9. Device caches in IndexedDB; plays immediately

Second device, same name: steps 2–3 hit Supabase CDN — no Alien PC call.

---

## Changing voice, speed, or phrases

### Change Kokoro voice

1. Edit `KOKORO_VOICE` in `services/voice-worker/docker-compose.yml`
2. Set matching `NEXT_PUBLIC_VOICE_CLIP_PROFILE` on Vercel (e.g. `kokoro-bm-fable`)
3. `docker compose up --build -d` on Alien PC
4. Bump `DANIEL_TURN_CACHE_GENERATION` in `lib/local-say/env.ts`
5. Clear Supabase `voice-clips` bucket
6. Redeploy Vercel; users clear site data or wait for IndexedDB generation bump

### Change speech speed

1. Edit `KOKORO_SPEED` in `docker-compose.yml` (0.5–2.0)
2. Rebuild Docker on Alien PC
3. Bump `DANIEL_TURN_CACHE_GENERATION`
4. Clear Supabase `voice-clips` bucket
5. Redeploy Vercel

### Change phrase wording

1. Edit `buildPlayerTurnPhrase()` or `buildGameOnPhrase()` in the repo
2. Bump `DANIEL_TURN_CACHE_GENERATION`
3. Clear Supabase `voice-clips` bucket (old text is baked into cached WAVs)
4. Deploy Vercel — no Alien PC code change needed

---

## Troubleshooting

### Still hearing Daniel on one device

| Cause | Fix |
|-------|-----|
| Running `localhost` on Mac | Dev uses macOS `say` (Daniel). Test production URL instead. |
| Stale IndexedDB | Clear site data for the app, or wait for cache generation bump after deploy |
| Old Supabase clips | Delete objects in `voice-clips` bucket |
| Old bundled WAV | Removed from repo; hard-refresh / reinstall PWA |

### Two different voices in one match

Should not happen — all names use the same Kokoro pipeline. If it does, one device is likely on localhost dev or has stale cache.

### Voice synthesis fails in production

1. `curl https://your-tunnel.trycloudflare.com/health` — is cloudflared running?
2. Is `VOICE_SYNTHESIS_URL` on Vercel current? (tunnel URL rotates)
3. Is `SUPABASE_SERVICE_ROLE_KEY` set? (upload fails without it)
4. On Alien PC: `docker compose ps` — are both `kokoro` and `voice-worker` up?

### Profile page stuck loading

Fixed in profile cloud sync hooks — ensure latest deploy is live. See `features/profile/hooks/useProfileCloudSync.ts`.

---

## Key files reference

| Path | Purpose |
|------|---------|
| `docs/VOICE.md` | This document |
| `services/voice-worker/` | Docker stack (Kokoro + adapter) |
| `services/voice-worker/docker-compose.yml` | Voice, speed, token config |
| `app/api/local-say/route.ts` | Vercel synthesis + Supabase upload |
| `utils/speech.ts` | Client audio pipeline |
| `lib/voice-clips/paths.ts` | Supabase storage paths |
| `lib/voice-clips/profile.ts` | Voice profile slug |
| `lib/local-say/env.ts` | Cache generation, remote worker URL |
| `lib/google-tts/phrases.ts` | Turn phrase text |
| `lib/game-on-callouts.ts` | Game On phrase text |
| `supabase/migrations/20260708190000_voice_clips_storage.sql` | Storage bucket |

---

## Legacy: Piper

Piper (`en_GB-alan-medium`, Northern English Male, etc.) is still supported via `VOICE_ENGINE=piper`. Kokoro George is the recommended production voice. See `services/voice-worker/VOICES.md` for quick voice-switch notes.
