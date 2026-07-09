# Choosing a Piper voice

Daniel is macOS-only. On the Alien PC we use **Piper** — pick the voice that fits DartOS best.

**Hear all Piper samples:** https://rhasspy.github.io/piper-samples/

## Quick preview (recommended)

On the Alien PC, from `services/voice-worker`:

```powershell
docker compose run --rm voice-worker node preview-voices.mjs
```

Open the `previews/` folder and listen to **turn** + **game-on** clips for each voice.

## Good starting points for darts callouts

| Profile id (`NEXT_PUBLIC_VOICE_CLIP_PROFILE`) | Piper model | Notes |
|---|---|---|
| `en-gb-northern-english-male` | en_GB-northern_english_male-medium | **Default** — UK male, less flat than Alan |
| `en-gb-cori-high` | en_GB-cori-high | UK, higher quality, slightly softer |
| `en-us-lessac` | en_US-lessac-medium | US arena / PA style |
| `en-us-ryan` | en_US-ryan-medium | US deep male |
| `en-gb-alan` | en_GB-alan-medium | Previous default — many find it dull |

## After you pick a voice

1. Set model in `docker-compose.yml` → `PIPER_MODEL_PATH` (rebuild: `docker compose up --build -d`)
2. Set **same profile id** on Vercel: `NEXT_PUBLIC_VOICE_CLIP_PROFILE=en-gb-northern-english-male`
3. **Clear Supabase** `voice-clips` bucket (old voice clips must go)
4. Redeploy Vercel

Everyone in a match will use the same Piper voice.
