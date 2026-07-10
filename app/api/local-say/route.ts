import { NextResponse } from "next/server";
import {
  isRuntimeVoiceSynthesisAvailable,
  LOCAL_SAY_TURN_RATE,
  LOCAL_SAY_TURN_VOICE,
} from "@/lib/local-say/env";
import {
  buildLocalSayCacheKey,
  cacheLocalSay,
  getCachedLocalSay,
} from "@/lib/local-say/server-cache";
import {
  isRemoteVoiceSynthesisConfigured,
  synthesizeRemote,
} from "@/lib/local-say/synthesize-remote";
import { synthesizeLocalSay } from "@/lib/local-say/synthesize";
import { fetchVoiceClipBuffer, uploadVoiceClip } from "@/lib/voice-clips/storage.server";

interface LocalSayRequestBody {
  text?: string;
  storagePath?: string;
}

function wavResponse(
  audio: Buffer,
  cacheStatus: "storage-hit" | "disk-hit" | "generated",
): NextResponse {
  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Voice-Cache": cacheStatus,
    },
  });
}

async function synthesizePhrase(text: string): Promise<Buffer> {
  if (isRemoteVoiceSynthesisConfigured()) {
    return synthesizeRemote(text);
  }

  if (isRuntimeVoiceSynthesisAvailable()) {
    return synthesizeLocalSay(text, LOCAL_SAY_TURN_VOICE, LOCAL_SAY_TURN_RATE);
  }

  throw new Error(
    "No voice synthesis backend is configured. Set VOICE_SYNTHESIS_URL for Vercel or PIPER_MODEL_PATH on the host.",
  );
}

export async function POST(request: Request) {
  let body: LocalSayRequestBody;

  try {
    body = (await request.json()) as LocalSayRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const cacheKey = buildLocalSayCacheKey(text);
  const storagePath =
    body.storagePath?.trim().replace(/^\/+/, "") || `phrases/${cacheKey}.wav`;

  const stored = await fetchVoiceClipBuffer(storagePath);
  if (stored) {
    cacheLocalSay(cacheKey, stored);
    return wavResponse(stored, "storage-hit");
  }

  const cached = getCachedLocalSay(cacheKey);
  if (cached) {
    void uploadVoiceClip(storagePath, cached);
    return wavResponse(cached, "disk-hit");
  }

  if (!isRuntimeVoiceSynthesisAvailable() && !isRemoteVoiceSynthesisConfigured()) {
    return NextResponse.json(
      {
        error:
          "Voice synthesis is unavailable. Configure VOICE_SYNTHESIS_URL (production) or run on macOS for development.",
      },
      { status: 503 },
    );
  }

  try {
    const audio = await synthesizePhrase(text);
    cacheLocalSay(cacheKey, audio);
    void uploadVoiceClip(storagePath, audio);
    return wavResponse(audio, "generated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice synthesis failed";
    console.error("[api/local-say]", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
