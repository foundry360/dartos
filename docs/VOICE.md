# Player voice announcements (turn + Game On)

DartOS calls out **player turns**, **Game On**, visit scores, and match commentary with a single shared voice. Each unique phrase is synthesized **once**, stored in Supabase Storage, and served from CDN on every device afterward.

Production uses **Kokoro `bm_george`** (British English male) on a **Linux VPS**. There are no per-request Google TTS charges for player names or fixed callouts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser / PWA (any subscriber device)                                  │
│                                                                         │
│  1. IndexedDB cache (per device)                                        │
│  2. Supabase Storage CDN (global — scores, commentary, turns, game-on)  │
│  3. POST /api/local-say on Vercel (cache miss only — new player names)  │
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
                                │ HTTPS (stable subdomain)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Linux VPS (IONOS / DigitalOcean / etc.)                                │
│                                                                         │
│  nginx :443  ──►  voice-worker :8787  ──►  kokoro :7860                │
│  (Let's Encrypt)    (DartOS adapter)        (Hangry Labs KokoroTTS)     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Production URL:** `https://voice.foundry360.us` (GoDaddy DNS → IONOS VPS)

### What runs where

| Component | Where | Role |
|-----------|-------|------|
| **Phrase text** | DartOS repo (`lib/google-tts/phrases.ts`, `lib/bobs-27-callouts.ts`, etc.) | Builds strings like `"Round complete"` |
| **Voice + speed** | VPS `docker-compose.yml` | Kokoro voice id and `KOKORO_SPEED` |
| **Clip storage** | Supabase `voice-clips` bucket | One WAV per slug, global CDN |
| **Device cache** | Browser IndexedDB | Avoids re-downloading known clips |
| **Synthesis trigger** | Vercel `/api/local-say` | Only on first sight of a new player name |
| **Public worker URL** | VPS nginx + subdomain | Stable HTTPS for Vercel → worker calls |

The VPS does **not** contain phrase logic. It receives plain text and returns audio.

### Runtime vs bootstrap

| Phase | VPS required? |
|-------|---------------|
| Normal match play (seeded scores, commentary, known names) | **No** — Supabase CDN |
| Brand-new player name (never synthesized) | **Yes** — one-time synthesis via `/api/local-say` |
| One-time clip seed (`npm run seed-voice-clips`) | **Yes** — run on VPS with `localhost:8787` |

After seeding, the VPS can be offline and most voice still works.

---

## Phrases (controlled in this repo)

| Callout | Source file | Example output |
|---------|-------------|----------------|
| Player turn | `lib/google-tts/phrases.ts` → `buildPlayerTurnPhrase()` | `JayDog, you're up.` |
| Game On | `lib/game-on-callouts.ts` → `buildGameOnPhrase()` | `Game on. Jay Dog to throw.` |
| Bob's 27 round end | `lib/bobs-27-callouts.ts` | `Round complete` |
| Visit scores | `lib/score-callouts.ts` | `One hundred and eighty` |
| Name sanitization | `lib/google-tts/phrases.ts` → `sanitizePlayerNameForTts()` | Strips unsafe chars, max 48 chars |

Client playback pipeline: `utils/speech.ts`, `utils/score-audio.ts`, `utils/commentary-audio.ts`  
Gesture unlock (PWA autoplay): `hooks/useMatchVoiceReady.ts`, `utils/voice-playback.ts`  
API route that uploads clips: `app/api/local-say/route.ts`  
Storage paths: `lib/voice-clips/paths.ts`

### Visit totals and all match commentary

All fixed callouts use the **same Kokoro George pipeline** via Supabase (`commentary/` and `scores/` folders).

**One-time seed** (voice worker must be running on the VPS):

```bash
VOICE_SYNTHESIS_URL=http://localhost:8787 npm run seed-voice-clips
```

See [`docs/VOICE-VPS.md`](./VOICE-VPS.md) for the full VPS + seed walkthrough.

This uploads ~900 clips. Takes 20–60 minutes on a 2 GB VPS. Safe to stop and re-run; it upserts each file.

---

## Voice settings (controlled on the VPS)

| Setting | Location | Default |
|---------|----------|---------|
| Engine | `docker-compose.yml` → `VOICE_ENGINE` | `kokoro` |
| Voice | `KOKORO_VOICE` | `bm_george` |
| Speed | `KOKORO_SPEED` | `1.2` (range 0.5–2.0) |
| Auth token | `VOICE_SYNTHESIS_TOKEN` | required in production |

Preview George at different speeds (SSH tunnel to VPS Kokoro UI on port 7860, or curl from the VPS):

```bash
curl -X POST http://localhost:7860/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"Game On - JayDog To Throw","voice":"bm_george","speed":1.2}' \
  -o test.wav
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
      jaydog.wav
    game-on/
      jaydog.wav
    scores/
      one-hundred-and-eighty.wav
    commentary/
      bobs-27/
        round-complete.wav
```

Clips are keyed by **name slug**, not user ID. `"JayDog"` and `"jaydog"` normalize to the same slug.

---

## Cache layers

When a device needs audio:

1. **IndexedDB** (`utils/tts-cache.ts`) — instant replay on the same device
2. **Supabase CDN** — global cache; works when the VPS is off
3. **`/api/voice-clip`** — Vercel proxy fallback if CDN fetch fails
4. **Vercel `/api/local-say`** — checks Supabase server-side, calls worker if missing
5. **Voice worker → Kokoro** — generates WAV, uploads to Supabase

Cache invalidation uses `KOKORO_VOICE_CACHE_GENERATION` in `lib/local-say/env.ts` plus the voice profile slug.

---

## Full setup (production)

### 1. Supabase

1. Run all migrations in `supabase/migrations/` (including `20260708190000_voice_clips_storage.sql`).
2. Copy **Project URL**, **anon key**, and **service_role key** from Settings → API.

### 2. Voice worker VPS

**Step-by-step guide:** [`docs/VOICE-VPS.md`](./VOICE-VPS.md)

Summary:

1. Linux VPS with Docker (2 vCPU / 2 GB+ RAM)
2. `docker compose up -d` in `services/voice-worker`
3. GoDaddy (or other) DNS: `voice.yourdomain.com` → VPS IP
4. nginx + Let's Encrypt → `https://voice.yourdomain.com`
5. Seed clips: `VOICE_SYNTHESIS_URL=http://localhost:8787 npm run seed-voice-clips` on the VPS

See also: [`services/voice-worker/README.md`](../services/voice-worker/README.md)

### 3. Vercel environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Uploads clips to Storage from `/api/local-say` |
| `VOICE_SYNTHESIS_URL` | Yes | Stable HTTPS worker URL, e.g. `https://voice.foundry360.us` |
| `VOICE_SYNTHESIS_TOKEN` | Yes | Must match `services/voice-worker/.env` on the VPS |
| `NEXT_PUBLIC_VOICE_CLIP_PROFILE` | Yes | Must match voice, e.g. `kokoro-bm-george` |

Redeploy after changing env vars.

### 4. Ongoing operations

- VPS only needed for **new player names** after initial seed
- After a clip exists in Supabase, all devices play from CDN even if the VPS is off
- `docker compose up -d --build` on the VPS after pulling voice-worker changes

**Cost:** ~$5/mo VPS + Supabase free tier at DartOS scale. No Google API usage for player names.

---

## Local development (macOS)

On `npm run dev` on a Mac, `/api/local-say` uses **macOS `say`** with **Daniel (English UK)** at 168 wpm — not Kokoro. This is intentional for zero-setup dev.

To test the production Kokoro path locally, set in `.env.local`:

```env
VOICE_SYNTHESIS_URL=https://voice.foundry360.us
VOICE_SYNTHESIS_TOKEN=your-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-george
```

---

## Request flow (new player name)

1. Match starts → voice clips prefetched; user gesture unlocks playback (`useMatchVoiceReady`)
2. `utils/speech.ts` checks IndexedDB → miss
3. Fetches Supabase CDN URL → miss (404)
4. POST `/api/local-say` with `{ text, storagePath }`
5. Vercel checks Supabase again → still miss
6. Vercel POST `{ text }` to `VOICE_SYNTHESIS_URL/synthesize`
7. Voice worker POST `{ text, voice, speed }` to Kokoro `/tts/generate`
8. WAV returned up the chain; Vercel uploads to Supabase
9. Device caches in IndexedDB; plays immediately

Second device, same name: steps 2–3 hit Supabase CDN — no VPS call.

---

## Changing voice, speed, or phrases

### Change Kokoro voice

1. Edit `KOKORO_VOICE` in `services/voice-worker/docker-compose.yml`
2. Set matching `NEXT_PUBLIC_VOICE_CLIP_PROFILE` on Vercel (e.g. `kokoro-bm-fable`)
3. `docker compose up --build -d` on the VPS
4. Bump `KOKORO_VOICE_CACHE_GENERATION` in `lib/local-say/env.ts`
5. Clear Supabase `voice-clips` bucket; re-run `npm run seed-voice-clips`
6. Redeploy Vercel

### Change speech speed

1. Edit `KOKORO_SPEED` in `docker-compose.yml` (0.5–2.0)
2. Rebuild Docker on the VPS
3. Bump `KOKORO_VOICE_CACHE_GENERATION`
4. Clear Supabase `voice-clips` bucket; re-seed
5. Redeploy Vercel

### Change phrase wording

1. Edit phrase builders in the repo (e.g. `buildRoundCompletePhrase()`)
2. Bump `KOKORO_VOICE_CACHE_GENERATION`
3. Clear Supabase `voice-clips` bucket; re-seed
4. Deploy Vercel — no worker code change needed

---

## Troubleshooting

### No voice in production (PWA / mobile)

Mobile browsers block audio until a user gesture. The app uses `useMatchVoiceReady` and `prepareMatchVoice()` on Start Match. Tap the board or Start before expecting callouts.

### Commentary silent (e.g. Bob's 27 "Round complete")

| Cause | Fix |
|-------|-----|
| Clips never seeded | Run `npm run seed-voice-clips` on the VPS |
| Clip 404 in Supabase | Check CDN URL for `commentary/bobs-27/round-complete.wav` |
| Autoplay blocked | Tap once on the play screen before finishing a round |

### Still hearing Daniel on one device

| Cause | Fix |
|-------|-----|
| Running `localhost` on Mac | Dev uses macOS `say` (Daniel). Test production URL instead. |
| Stale IndexedDB | Clear site data, or wait for cache generation bump after deploy |
| Old Supabase clips | Delete objects in `voice-clips` bucket; re-seed |

### Voice synthesis fails in production

1. `curl https://voice.yourdomain.com/health` — is the VPS up?
2. Does `VOICE_SYNTHESIS_URL` on Vercel match the HTTPS subdomain (not an old tunnel URL)?
3. Does `VOICE_SYNTHESIS_TOKEN` match the VPS `services/voice-worker/.env`?
4. Is `SUPABASE_SERVICE_ROLE_KEY` set on Vercel?
5. On VPS: `docker compose ps` — are both `kokoro` and `voice-worker` up?

### Seed command fails

1. Run seed **on the VPS** with `VOICE_SYNTHESIS_URL=http://localhost:8787`
2. Confirm `curl http://localhost:8787/health` returns `"ok":true`
3. Do not use expired `*.trycloudflare.com` URLs

---

## Key files reference

| Path | Purpose |
|------|---------|
| `docs/VOICE.md` | This document |
| `docs/VOICE-VPS.md` | VPS setup, nginx, seeding walkthrough |
| `services/voice-worker/` | Docker stack (Kokoro + adapter) |
| `services/voice-worker/docker-compose.yml` | Voice, speed, token config |
| `app/api/local-say/route.ts` | Vercel synthesis + Supabase upload |
| `app/api/voice-clip/route.ts` | CDN fallback proxy |
| `utils/voice-clip-client.ts` | Client fetch: CDN → API → local-say |
| `utils/voice-playback.ts` | Audio unlock + playback queue |
| `hooks/useMatchVoiceReady.ts` | PWA gesture gating |
| `lib/voice-clips/commentary-registry.ts` | All seed clip entries |
| `scripts/seed-all-voice-clips.ts` | One-time Supabase upload |
| `supabase/migrations/20260708190000_voice_clips_storage.sql` | Storage bucket |

---

## Legacy: home PC + Cloudflare quick tunnel

Previously documented for dev/bootstrap. **Do not use `*.trycloudflare.com` URLs in Vercel production** — they rotate on every `cloudflared` restart.

For a home machine without a VPS, use a **named Cloudflare Tunnel** with a fixed hostname, or migrate to the VPS setup in [`docs/VOICE-VPS.md`](./VOICE-VPS.md).

---

## Legacy: Piper

Piper (`en_GB-alan-medium`, etc.) is still supported via `VOICE_ENGINE=piper`. Kokoro George is the production voice. See `services/voice-worker/VOICES.md`.
