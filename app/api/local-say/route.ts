import { NextResponse } from "next/server";
import {
  isLocalSayAvailable,
  LOCAL_SAY_TURN_RATE,
  LOCAL_SAY_TURN_VOICE,
} from "@/lib/local-say/env";
import { synthesizeLocalSay } from "@/lib/local-say/synthesize";

interface LocalSayRequestBody {
  text?: string;
}

export async function POST(request: Request) {
  if (!isLocalSayAvailable()) {
    return NextResponse.json(
      { error: "Local say TTS is only available on macOS during development." },
      { status: 503 },
    );
  }

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

  try {
    const audio = synthesizeLocalSay(text, LOCAL_SAY_TURN_VOICE, LOCAL_SAY_TURN_RATE);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local say synthesis failed";
    console.error("[api/local-say]", message);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
