# Voice configuration quick reference

Production default: **Kokoro `bm_george`** at **speed 1.2**.

**Full documentation:** [`docs/VOICE.md`](../../docs/VOICE.md)

**Hear George:** [kokorotts-bm_george.mp3](https://hangry-labs.github.io/kokoroTTS/examples/kokorotts-bm_george.mp3)

More voices: [Kokoro examples page](https://hangry-labs.github.io/kokoroTTS/examples/)

---

## Run / verify stack

```powershell
cd services\voice-worker
docker compose up --build -d
curl http://localhost:8787/health
```

Expected: `{"ok":true,"engine":"kokoro","voice":"bm_george","speed":1.2}`

---

## Change speech speed

1. Edit `KOKORO_SPEED` in `docker-compose.yml` (range **0.5–2.0**)
2. `docker compose up --build -d`
3. Bump `DANIEL_TURN_CACHE_GENERATION` in `lib/local-say/env.ts`
4. Clear Supabase **`voice-clips`** bucket
5. Redeploy Vercel

Preview on Alien PC:

```powershell
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":1.0}" -o speed-1.0.wav
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":1.2}" -o speed-1.2.wav
curl -X POST http://localhost:7860/tts/generate -H "Content-Type: application/json" -d "{\"text\":\"Game On - JayDog To Throw\",\"voice\":\"bm_george\",\"speed\":0.88}" -o speed-0.88.wav
```

---

## Switch Kokoro voice

1. Edit `docker-compose.yml`:

```yaml
KOKORO_VOICE: bm_fable   # or bm_lewis, bm_daniel, etc.
```

2. Set matching profile on Vercel:

```env
NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-fable
```

3. Rebuild Docker, bump cache generation, clear Supabase bucket, redeploy Vercel.

---

## Legacy: Piper

Set `VOICE_ENGINE=piper` and configure `PIPER_MODEL_PATH`. Voice ids: run `node preview-voices.mjs`.
