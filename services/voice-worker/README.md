# DartOS voice worker

Thin HTTP adapter between Vercel and [Kokoro TTS](https://github.com/Hangry-Labs/kokoroTTS). Synthesizes clips on a Linux VPS; Supabase Storage serves them globally afterward.

**Full stack documentation:** [`docs/VOICE.md`](../../docs/VOICE.md)  
**VPS setup walkthrough:** [`docs/VOICE-VPS.md`](../../docs/VOICE-VPS.md)

## What this directory contains

```
services/voice-worker/
  docker-compose.yml   # Kokoro + voice-worker (start here)
  index.mjs            # POST /synthesize → Kokoro /tts/generate
  Dockerfile           # Node adapter image
  VOICES.md            # Quick voice/speed switch reference
```

## Production (Linux VPS)

Production runs on a small VPS (IONOS, DigitalOcean, Hetzner, etc.) behind nginx + Let's Encrypt at a stable subdomain such as `https://voice.foundry360.us`.

**Full walkthrough:** [`docs/VOICE-VPS.md`](../../docs/VOICE-VPS.md)

### Quick start on the VPS

```bash
git clone https://github.com/foundry360/dartos.git
cd dartos/services/voice-worker
openssl rand -hex 32   # → VOICE_SYNTHESIS_TOKEN
echo 'VOICE_SYNTHESIS_TOKEN=YOUR_TOKEN' > .env
docker compose up -d --build
curl http://localhost:8787/health
```

Starts:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `kokoro` | `hangrylabs/kokorotts:v0.2` | 7860 (internal) | TTS engine |
| `voice-worker` | built locally | **8787** | DartOS `/synthesize` API |

Expose via nginx on **443** (not raw 8787). Set `VOICE_SYNTHESIS_URL=https://voice.yourdomain.com` on Vercel.

### Seed clips to Supabase

Run once on the VPS (from repo root):

```bash
VOICE_SYNTHESIS_URL=http://localhost:8787 \
VOICE_SYNTHESIS_TOKEN=YOUR_TOKEN \
npm run seed-voice-clips
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

### After git pull

```bash
cd ~/dartos/services/voice-worker
git pull
docker compose up -d --build
curl http://localhost:8787/health
```

---

## API

### `GET /health`

Returns engine status. Use from Vercel, monitoring, or `curl https://voice.yourdomain.com/health`.

### `POST /synthesize`

Request:

```json
{ "text": "JayDog, you're up." }
```

Response: `audio/wav` bytes

Auth — set `VOICE_SYNTHESIS_TOKEN` in `.env` (loaded by docker-compose):

```
Authorization: Bearer <token>
```

The worker forwards text to Kokoro unchanged. **Phrase wording is controlled in the DartOS app repo**, not here.

---

## Configuration (`docker-compose.yml`)

Create `.env` beside `docker-compose.yml`:

```env
VOICE_SYNTHESIS_TOKEN=your-long-random-secret
```

```yaml
environment:
  VOICE_ENGINE: kokoro
  KOKORO_URL: http://kokoro:7860
  KOKORO_VOICE: bm_george
  KOKORO_SPEED: "1.2"          # 0.5–2.0; 1.0 = Kokoro default
  VOICE_SYNTHESIS_TOKEN: ${VOICE_SYNTHESIS_TOKEN:-}
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_ENGINE` | `kokoro` | `kokoro`, `piper`, or `mac` (macOS dev only) |
| `KOKORO_VOICE` | `bm_george` | Kokoro voice id |
| `KOKORO_SPEED` | `1.2` | Speech speed multiplier |
| `VOICE_SYNTHESIS_TOKEN` | — | Bearer token (required in production) |

After changing voice or speed: rebuild Docker, bump `KOKORO_VOICE_CACHE_GENERATION` in `lib/local-say/env.ts`, clear Supabase `voice-clips`, re-seed. Details in [`VOICES.md`](./VOICES.md) and [`docs/VOICE.md`](../../docs/VOICE.md).

---

## Local dev (macOS, no Docker)

```bash
cd services/voice-worker
node index.mjs
```

Uses `VOICE_ENGINE=mac` automatically on darwin — macOS `say` + Daniel. Production uses Kokoro via Docker on the VPS.

---

## Legacy: home PC + Cloudflare quick tunnel

**Not for production.** Ephemeral `*.trycloudflare.com` URLs rotate when `cloudflared` restarts. Use the VPS setup in [`docs/VOICE-VPS.md`](../../docs/VOICE-VPS.md) instead.

---

## Legacy: Piper

Set `VOICE_ENGINE=piper` and configure `PIPER_MODEL_PATH`. Kokoro George is recommended. Piper voice previews: `node preview-voices.mjs` (requires Piper installed).

---

## Optional: GCP Cloud Run

See `deploy-cloud-run.sh`. Kokoro requires bundling the TTS engine in the image; the VPS + docker-compose path is simpler for DartOS.
