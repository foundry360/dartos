# DartOS voice worker

Small HTTP service that synthesizes player-name voice clips with Piper (Linux/production) or macOS `say` (local dev).

Deploy with **Docker** (recommended), Railway, Fly.io, Render, or any VPS — **not** on Vercel.

## Endpoints

- `GET /health` — liveness check
- `POST /synthesize` — body `{ "text": "Mikey, you're up." }` → WAV bytes

Optional auth: set `VOICE_SYNTHESIS_TOKEN` and send `Authorization: Bearer <token>`.

## Docker (recommended)

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

The image includes Piper and the `en_GB-alan-medium` British English model. Rebuild to change voice.

Build for cloud deploy (linux/amd64 from Apple Silicon):

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

On macOS without Docker, Piper is optional — `node index.mjs` uses `say` + Daniel automatically.

## Railway / Fly / Render

Use the Dockerfile in this folder as the build context. Set `VOICE_SYNTHESIS_URL` on Vercel to the service URL.

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

## GCP Cloud Run (serverless — recommended for production)

Cloud Run runs the same Docker image **only when needed**. At DartOS scale this is usually **$0** on the free tier.

### 1. One-time GCP setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Link a billing account (required even for free tier)
3. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
4. Log in and pick the project:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Deploy the worker

```bash
cd services/voice-worker
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

Optional shared secret (recommended):

```bash
VOICE_SYNTHESIS_TOKEN=choose-a-long-random-string ./deploy-cloud-run.sh
```

The script prints a URL like `https://dartos-voice-worker-xxxxx-uc.a.run.app`.

### 3. Wire Vercel

In **Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `VOICE_SYNTHESIS_URL` | Cloud Run URL from step 2 |
| `VOICE_SYNTHESIS_TOKEN` | Same secret (if you set one) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

Redeploy Vercel after saving.

### 4. Test

```bash
curl -sS https://YOUR-CLOUD-RUN-URL/health
```

Play a match with a new player name — two clips (`turn` + `game-on`) upload to Supabase Storage once, then CDN serves them after that.

