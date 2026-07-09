# DartOS voice: Kokoro George (default)

Production uses **Kokoro `bm_george`** — British English male, authoritative announcer style.

**Hear George:** [kokorotts-bm_george.mp3](https://hangry-labs.github.io/kokoroTTS/examples/kokorotts-bm_george.mp3)

More British males on the [Kokoro examples page](https://hangry-labs.github.io/kokoroTTS/examples/).

## Run on Alien PC

```powershell
cd services\voice-worker
docker compose up --build -d
```

This starts:
- **kokoro** — Kokoro TTS engine (internal)
- **voice-worker** — DartOS adapter on port **8787** (same URL for Vercel + cloudflared)

Test:

```powershell
curl http://localhost:8787/health
```

Expect: `{"ok":true,"engine":"kokoro","voice":"bm_george","speed":1.2}`

## Speech speed

Kokoro defaults to `speed: 1.0`. DartOS currently uses **1.2** (range **0.5–2.0**).

Preview speeds (Kokoro must be running):

```powershell
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":1.0}" -o speed-1.0.wav
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":1.2}" -o speed-1.2.wav
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":0.88}" -o speed-0.88.wav
```

To change production speed, edit `KOKORO_SPEED` in `docker-compose.yml`, rebuild Docker, bump `DANIEL_TURN_CACHE_GENERATION` in `lib/local-say/env.ts`, clear the Supabase `voice-clips` bucket, and redeploy Vercel.

## Switch Kokoro voice

Edit `docker-compose.yml`:

```yaml
KOKORO_VOICE: bm_fable   # or bm_lewis, bm_daniel, etc.
```

Set matching profile on Vercel:

```env
NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-fable
```

Rebuild Docker, **clear Supabase `voice-clips` bucket**, redeploy Vercel.

## Legacy: Piper

Set `VOICE_ENGINE=piper` and use the old `Dockerfile.piper` build if needed. Kokoro is recommended.

Profile ids for Piper voices are in `preview-voices.mjs` output.
