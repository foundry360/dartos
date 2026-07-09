# DartOS voice worker

Thin HTTP adapter between Vercel and [Kokoro TTS](https://github.com/Hangry-Labs/kokoroTTS). Synthesizes player-name clips on a home PC; Supabase Storage serves them globally afterward.

**Full stack documentation:** [`docs/VOICE.md`](../../docs/VOICE.md)

## What this directory contains

```
services/voice-worker/
  docker-compose.yml   # Kokoro + voice-worker (start here)
  index.mjs            # POST /synthesize → Kokoro /tts/generate
  Dockerfile           # Node adapter image
  VOICES.md            # Quick voice/speed switch reference
```

## Quick start (Alien PC / Windows)

### 1. Docker Desktop

Install from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

### 2. Start the stack

```powershell
git clone https://github.com/foundry360/dartos.git
cd dartos\services\voice-worker
docker compose up --build -d
```

Starts:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `kokoro` | `hangrylabs/kokorotts:v0.2` | 7860 (internal) | TTS engine + browser UI |
| `voice-worker` | built locally | **8787** | DartOS `/synthesize` API |

### 3. Test locally

```powershell
curl http://localhost:8787/health
```

Expected:

```json
{"ok":true,"engine":"kokoro","voice":"bm_george","speed":1.2}
```

```powershell
curl -X POST http://localhost:8787/synthesize -H "Content-Type: application/json" -d "{\"text\":\"JayDog, you're up.\"}" -o turn.wav
```

Open Kokoro's UI directly: `http://localhost:7860`

### 4. Expose to Vercel (Cloudflare Tunnel)

```powershell
cloudflared tunnel --url http://localhost:8787
```

Copy the `https://….trycloudflare.com` URL → set as `VOICE_SYNTHESIS_URL` on Vercel.

See [`docs/VOICE.md`](../../docs/VOICE.md) for the complete Vercel + Supabase setup.

### 5. After git pull

```powershell
git pull
docker compose up --build -d
```

---

## API

### `GET /health`

Returns engine status. Vercel/cloudflared can use this to verify the tunnel.

### `POST /synthesize`

Request:

```json
{ "text": "JayDog, you're up." }
```

Response: `audio/wav` bytes

Optional auth — set `VOICE_SYNTHESIS_TOKEN` in `docker-compose.yml`:

```
Authorization: Bearer <token>
```

The worker forwards text to Kokoro unchanged. **Phrase wording is controlled in the DartOS app repo**, not here.

---

## Configuration (`docker-compose.yml`)

```yaml
environment:
  VOICE_ENGINE: kokoro
  KOKORO_URL: http://kokoro:7860
  KOKORO_VOICE: bm_george
  KOKORO_SPEED: "1.2"          # 0.5–2.0; 1.0 = Kokoro default
  VOICE_SYNTHESIS_TOKEN: ""    # optional shared secret
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_ENGINE` | `kokoro` | `kokoro`, `piper`, or `mac` (macOS dev only) |
| `KOKORO_VOICE` | `bm_george` | Kokoro voice id |
| `KOKORO_SPEED` | `1.2` | Speech speed multiplier |
| `VOICE_SYNTHESIS_TOKEN` | — | Bearer token if set |

After changing voice or speed: rebuild Docker, bump `DANIEL_TURN_CACHE_GENERATION` in `lib/local-say/env.ts`, clear Supabase `voice-clips`, redeploy Vercel. Details in [`VOICES.md`](./VOICES.md) and [`docs/VOICE.md`](../../docs/VOICE.md).

---

## macOS dev (no Docker)

```bash
cd services/voice-worker
node index.mjs
```

Uses `VOICE_ENGINE=mac` automatically on darwin — macOS `say` + Daniel. Production uses Kokoro via Docker.

---

## Legacy: Piper

Set `VOICE_ENGINE=piper` and configure `PIPER_MODEL_PATH`. Kokoro George is recommended. Piper voice previews: `node preview-voices.mjs` (requires Piper installed).

---

## Optional: GCP Cloud Run

Alternative to a home PC. See `deploy-cloud-run.sh`. At DartOS scale a home Alien PC is simpler and avoids GCP entirely.
