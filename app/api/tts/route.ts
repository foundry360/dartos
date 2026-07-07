import { NextResponse } from "next/server";
import {
  getGeminiApiTtsModelName,
  getGoogleCloudTtsVoiceName,
  isGoogleCloudTtsConfigured,
} from "@/lib/google-tts/env";
import {
  buildPlayerNamePhrase,
  buildPlayerTurnPhrase,
  getTtsPhrase,
  isAllowedTtsPhraseId,
  type AllowedTtsPhraseId,
} from "@/lib/google-tts/phrases";
import {
  cacheServerSpeech,
  getCachedServerSpeech,
  getServerTtsCacheKey,
} from "@/lib/google-tts/server-cache";
import { synthesizeSpeech } from "@/lib/google-tts/synthesize";

interface TtsRequestBody {
  phraseId?: string;
  playerName?: string;
}

function resolvePhraseText(body: TtsRequestBody): string | null {
  const phraseId = body.phraseId?.trim();

  if (!phraseId) {
    return null;
  }

  if (phraseId === "player-turn") {
    return buildPlayerTurnPhrase(body.playerName ?? "");
  }

  if (phraseId === "player-turn-name") {
    return buildPlayerNamePhrase(body.playerName ?? "");
  }

  if (!isAllowedTtsPhraseId(phraseId)) {
    return null;
  }

  return getTtsPhrase(phraseId as AllowedTtsPhraseId);
}

export async function POST(request: Request) {
  let body: TtsRequestBody;

  try {
    body = (await request.json()) as TtsRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const phraseText = resolvePhraseText(body);

  if (!phraseText) {
    return NextResponse.json({ error: "Unknown phraseId" }, { status: 400 });
  }

  if (!isGoogleCloudTtsConfigured()) {
    return NextResponse.json(
      {
        error: "Google Text-to-Speech is not configured",
        message:
          "Add GOOGLE_GEMINI_API_KEY from https://aistudio.google.com/apikey for Sadachbia and other Gemini voices.",
      },
      { status: 503 },
    );
  }

  try {
    const model = getGeminiApiTtsModelName();
    const voice = getGoogleCloudTtsVoiceName();
    const cacheKey = getServerTtsCacheKey(phraseText, model, voice);
    const cached = getCachedServerSpeech(cacheKey);

    if (cached) {
      return new NextResponse(new Uint8Array(cached.audio), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "no-store",
          "X-TTS-Cache": "hit",
        },
      });
    }

    const { audio, contentType } = await synthesizeSpeech(phraseText);
    cacheServerSpeech(cacheKey, { audio, contentType });

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-TTS-Cache": "miss",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS synthesis failed";
    console.error("[api/tts]", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
