import { NextResponse } from "next/server";
import { fetchVoiceClipBuffer } from "@/lib/voice-clips/storage.server";

function isAllowedVoiceClipPath(storagePath: string): boolean {
  if (!storagePath || storagePath.includes("..")) {
    return false;
  }

  return /^[a-z0-9-]+\/(?:turns|game-on|scores|commentary)\/.+\.wav$/.test(storagePath);
}

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path")?.trim().replace(/^\/+/, "");

  if (!path || !isAllowedVoiceClipPath(path)) {
    return NextResponse.json({ error: "Invalid voice clip path" }, { status: 400 });
  }

  const audio = await fetchVoiceClipBuffer(path);

  if (!audio) {
    return NextResponse.json({ error: "Voice clip not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
