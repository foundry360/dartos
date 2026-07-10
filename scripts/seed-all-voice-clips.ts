#!/usr/bin/env node
/**
 * Seed all George voice clips (scores + match commentary) to Supabase Storage.
 *
 * Requires:
 *   VOICE_SYNTHESIS_URL (or run on VPS with localhost:8787)
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 *
 * See docs/VOICE-VPS.md for VPS setup and seeding.
 *
 * Run:
 *   npm run seed-voice-clips
 */
import { createClient } from "@supabase/supabase-js";
import { getAllVoiceClipSeedEntries } from "../lib/voice-clips/commentary-registry";

const profile =
  process.env.NEXT_PUBLIC_VOICE_CLIP_PROFILE?.trim() ||
  process.env.VOICE_CLIP_PROFILE?.trim() ||
  "kokoro-bm-george";
const workerUrl = (process.env.VOICE_SYNTHESIS_URL?.trim() || "http://localhost:8787").replace(
  /\/+$/,
  "",
);
const token = process.env.VOICE_SYNTHESIS_TOKEN?.trim() || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

async function synthesize(text: string): Promise<Buffer> {
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

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const health = await fetch(`${workerUrl}/health`).catch(() => null);
  if (!health?.ok) {
    console.error(`Voice worker not reachable at ${workerUrl}/health`);
    process.exit(1);
  }

  console.log(`Voice worker: ${await health.text()}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clips = getAllVoiceClipSeedEntries();
  console.log(`Seeding ${clips.length} clips under ${profile}/ …`);

  for (const clip of clips) {
    const storagePath = `${profile}/${clip.storagePath}`;
    const audio = await synthesize(clip.phrase);
    const { error } = await supabase.storage.from("voice-clips").upload(storagePath, audio, {
      upsert: true,
      contentType: "audio/wav",
      cacheControl: "31536000",
    });

    if (error) {
      console.error(`Failed to upload ${storagePath}:`, error.message);
      process.exit(1);
    }

    console.log(`  ✓ ${storagePath}`);
  }

  console.log("Done.");
}

void main();
