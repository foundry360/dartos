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
Quick Cloudflare tunnels change every time cloudflared restarts.
On the Alien PC:
  1. docker compose up -d   (in services/voice-worker)
  2. cloudflared tunnel --url http://localhost:8787
  3. Copy the new https://….trycloudflare.com URL into .env.local as VOICE_SYNTHESIS_URL
  4. Re-run the seed command

Or seed from the Alien PC with VOICE_SYNTHESIS_URL=http://localhost:8787
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
