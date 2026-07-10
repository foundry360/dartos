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
 *   npm run seed-voice-clips -- --resume
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
const resume = process.argv.includes("--resume");
const maxAttempts = 3;
const minAudioBytes = 256;

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

  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length < minAudioBytes) {
    throw new Error(`Synthesis returned ${audio.length} bytes for "${text}"`);
  }

  return audio;
}

async function clipExists(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<boolean> {
  const { data, error } = await supabase.storage.from("voice-clips").download(storagePath);

  if (error || !data) {
    return false;
  }

  return data.size >= minAudioBytes;
}

async function uploadClip(
  supabase: SupabaseClient,
  storagePath: string,
  audio: Buffer,
): Promise<void> {
  const { error } = await supabase.storage.from("voice-clips").upload(storagePath, audio, {
    upsert: true,
    contentType: "audio/wav",
    cacheControl: "31536000",
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function seedClip(
  supabase: SupabaseClient,
  storagePath: string,
  phrase: string,
): Promise<"uploaded" | "skipped"> {
  if (resume && (await clipExists(supabase, storagePath))) {
    return "skipped";
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const audio = await synthesize(phrase);
      await uploadClip(supabase, storagePath, audio);
      return "uploaded";
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await new Promise((resolve) => {
          setTimeout(resolve, attempt * 2000);
        });
      }
    }
  }

  throw lastError ?? new Error(`Failed to seed ${storagePath}`);
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
  console.log(
    `Seeding ${clips.length} clips under ${profile}/ …${resume ? " (resume — skip existing)" : ""}`,
  );

  let uploaded = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const clip of clips) {
    const storagePath = `${profile}/${clip.storagePath}`;

    try {
      const result = await seedClip(supabase, storagePath, clip.phrase);

      if (result === "skipped") {
        skipped += 1;
        console.log(`  · skip ${storagePath}`);
        continue;
      }

      uploaded += 1;
      console.log(`  ✓ ${storagePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${storagePath}: ${message}`);
      console.error(`  ✗ ${storagePath}: ${message}`);
    }
  }

  console.log(`Done. uploaded=${uploaded} skipped=${skipped} failed=${failures.length}`);

  if (failures.length > 0) {
    console.error("\nFailed clips:");
    for (const failure of failures) {
      console.error(`  ${failure}`);
    }

    process.exit(1);
  }
}

void main();
