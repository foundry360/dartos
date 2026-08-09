import { VOICE_SYNTHESIS_TOKEN, VOICE_SYNTHESIS_URL } from "@/lib/local-say/env";

/** Keep under Vercel/function limits; cold Kokoro can take a while. */
const REMOTE_SYNTHESIS_TIMEOUT_MS = 45_000;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REMOTE_SYNTHESIS_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(
        message.trim() || `Remote voice synthesis failed (${response.status})`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Remote voice synthesis timed out after ${REMOTE_SYNTHESIS_TIMEOUT_MS}ms`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
