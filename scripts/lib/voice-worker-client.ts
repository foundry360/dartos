const token = process.env.VOICE_SYNTHESIS_TOKEN?.trim() || "";

function normalizeWorkerUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function resolveVoiceWorkerUrl(): Promise<string> {
  const configured = process.env.VOICE_SYNTHESIS_URL?.trim();
  const candidates = [
    ...(configured ? [normalizeWorkerUrl(configured)] : []),
    "http://localhost:8787",
  ];

  const uniqueCandidates = [...new Set(candidates)];

  for (const url of uniqueCandidates) {
    const health = await fetch(`${url}/health`).catch(() => null);
    if (health?.ok) {
      return url;
    }
  }

  console.error("Voice worker not reachable. Checked:");
  for (const url of uniqueCandidates) {
    console.error(`  ${url}/health`);
  }

  console.error(`
Production voice worker should be a stable HTTPS URL (VPS + subdomain).
See docs/VOICE-VPS.md

On the VPS:
  1. cd services/voice-worker && docker compose up -d
  2. curl http://localhost:8787/health
  3. Seed from the VPS: VOICE_SYNTHESIS_URL=http://localhost:8787 npm run seed-voice-clips

If VOICE_SYNTHESIS_URL is set but unreachable, fix DNS/nginx or seed via localhost on the VPS.
`);

  process.exit(1);
}

export async function synthesizeVoiceClip(workerUrl: string, text: string): Promise<Buffer> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${workerUrl}/synthesize`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message.trim() || `Synthesis failed (${response.status}) for "${text}"`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function assertVoiceWorkerReady(): Promise<string> {
  const workerUrl = await resolveVoiceWorkerUrl();
  const health = await fetch(`${workerUrl}/health`);
  console.log(`Voice worker (${workerUrl}): ${await health.text()}`);
  return workerUrl;
}
