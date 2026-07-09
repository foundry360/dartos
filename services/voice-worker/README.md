# DartOS voice worker

Small HTTP service that synthesizes player-name voice clips with Piper. Each unique player name is generated **once**, then Supabase Storage serves the clip forever.

**Recommended for DartOS:** run this on a home PC (e.g. Alienware) with Docker — no GCP, no Google TTS API bills.

## Endpoints

- `GET /health` — liveness check
- `POST /synthesize` — body `{ "text": "Mikey, you're up." }` → WAV bytes

Optional auth: set `VOICE_SYNTHESIS_TOKEN` and send `Authorization: Bearer <token>`.

## Home PC setup (Alienware / Windows) — recommended

Your Alien PC stays on at home, runs Piper in Docker, and Vercel calls it only when a **new** player name appears.

### 1. Install Docker Desktop on the Alien PC

Download: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

Clone the repo (or copy `services/voice-worker` onto the machine):

```powershell
git clone https://github.com/foundry360/dartos.git
cd dartos\services\voice-worker
docker compose up --build -d
```

Test on the Alien PC:

```powershell
curl http://localhost:8787/health
```

### 2. Expose it to Vercel (Cloudflare Tunnel — free)

Vercel needs a public HTTPS URL. Cloudflare Tunnel avoids router port-forwarding.

On the Alien PC:

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Install `cloudflared`: [developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
3. Run a tunnel to the voice worker:

```powershell
cloudflared tunnel --url http://localhost:8787
```

Copy the `https://….trycloudflare.com` URL it prints.

Optional: set a shared secret in `docker-compose.yml`:

```yaml
environment:
  VOICE_SYNTHESIS_TOKEN: your-long-random-secret
```

Restart: `docker compose up -d`

### 3. Vercel env vars

| Variable | Value |
|---|---|
| `VOICE_SYNTHESIS_URL` | Cloudflare tunnel URL (no trailing slash) |
| `VOICE_SYNTHESIS_TOKEN` | Same secret (if you set one) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

Redeploy Vercel.

### 4. Keep the Alien PC on

- Only needs to be reachable when a **new** name is seen for the first time
- After that, clips play from Supabase CDN even if the PC is off
- Leave Docker set to start on boot if you want zero gaps for new signups

**Cost:** $0 for Piper + Cloudflare tunnel. You pay electricity for a PC you already own.

---

## Docker (any OS)

From this directory:

```bash
docker compose up --build
```

Test:

```bash
curl -sS http://localhost:8787/health
curl -sS -X POST http://localhost:8787/synthesize \
  -H 'Content-Type: application/json' \
  -d '{"text":"JayDog, you'\''re up."}' \
  --output /tmp/turn.wav
```

Point Vercel (or `.env.local`) at the worker:

```env
VOICE_SYNTHESIS_URL=http://your-host:8787
VOICE_SYNTHESIS_TOKEN=optional-shared-secret
```

The image includes Piper and the `en_GB-alan-medium` British English model (close to Daniel). Rebuild to change voice.

Build for linux/amd64 from Apple Silicon:

```bash
docker build --platform linux/amd64 -t dartos-voice-worker .
docker run --rm -p 8787:8787 dartos-voice-worker
```

## Environment

```env
PORT=8787
PIPER_BIN=/usr/local/bin/piper
PIPER_MODEL_PATH=/models/en_GB-alan-medium.onnx
VOICE_SYNTHESIS_TOKEN=
LOCAL_SAY_TURN_VOICE=Daniel (English (UK))
LOCAL_SAY_TURN_RATE=168
```

On macOS without Docker, `node index.mjs` uses `say` + Daniel automatically (dev only).

## Custom Piper model

Mount a different `.onnx` + `.onnx.json` pair and set `PIPER_MODEL_PATH`:

```yaml
# docker-compose.override.yml
services:
  voice-worker:
    volumes:
      - ./models:/models
    environment:
      PIPER_MODEL_PATH: /models/your-voice.onnx
```

Download voices from [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices).

## GCP Cloud Run (optional alternative)

Use this instead of a home PC if you don't want hardware running at home. See `deploy-cloud-run.sh`. At DartOS scale this is usually **$0** on the free tier, but a home Alien PC avoids GCP entirely.

```bash
cd services/voice-worker
chmod +x deploy-cloud-run.sh
GCP_PROJECT=dartos ./deploy-cloud-run.sh
```

Wire `VOICE_SYNTHESIS_URL` on Vercel to the Cloud Run URL.

