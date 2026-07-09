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

Expect: `{"ok":true,"engine":"kokoro","voice":"bm_george"}`

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
