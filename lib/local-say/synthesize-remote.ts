import { VOICE_SYNTHESIS_TOKEN, VOICE_SYNTHESIS_URL } from "@/lib/local-say/env";

export function isRemoteVoiceSynthesisConfigured(): boolean {
  return Boolean(VOICE_SYNTHESIS_URL);
}

export async function synthesizeRemote(text: string): Promise<Buffer> {
  if (!VOICE_SYNTHESIS_URL) {
    throw new Error("VOICE_SYNTHESIS_URL is not configured");
  }

  const endpoint = `${VOICE_SYNTHESIS_URL.replace(/\/+$/, "")}/synthesize`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (VOICE_SYNTHESIS_TOKEN) {
    headers.Authorization = `Bearer ${VOICE_SYNTHESIS_TOKEN}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      message.trim() || `Remote voice synthesis failed (${response.status})`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
