#!/usr/bin/env node
/**
 * Pre-generate visit score clips (0–180 + "No score") via the voice worker
 * and upload to Supabase Storage. Run once after deploy or voice change.
 *
 * Requires:
 *   VOICE_SYNTHESIS_URL  — voice worker (localhost on VPS, or https://voice.yourdomain.com)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Optional:
 *   VOICE_SYNTHESIS_TOKEN
 *   NEXT_PUBLIC_VOICE_CLIP_PROFILE (default: kokoro-bm-george)
 *
 * Example:
 *   node --env-file=.env.local scripts/seed-score-clips.mjs
 */
import { createClient } from "@supabase/supabase-js";

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

function buildClips() {
  const clips = [{ text: "No score", slug: "no-score" }];

  for (let score = 0; score <= 180; score += 1) {
    clips.push({ text: String(score), slug: String(score) });
  }

  return clips;
}

async function synthesize(text) {
  const headers = { "Content-Type": "application/json" };
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

  const status = await health.json();
  console.log(`Voice worker: ${JSON.stringify(status)}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clips = buildClips();
  console.log(`Seeding ${clips.length} score clips to ${profile}/scores/ …`);

  for (const clip of clips) {
    const storagePath = `${profile}/scores/${clip.slug}.wav`;
    const audio = await synthesize(clip.text);
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
