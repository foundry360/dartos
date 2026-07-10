#!/usr/bin/env node
/**
 * Seed George voice clips for X01 match commentary:
 *   - Game shot (leg / first leg / match)
 *   - You require 2–170
 *   - No Finish
 *
 * Run:
 *   npm run seed-x01-voice-clips
 */
import { createClient } from "@supabase/supabase-js";
import { getX01MatchVoiceClipSeedEntries } from "../lib/voice-clips/commentary-registry";
import {
  assertVoiceWorkerReady,
  synthesizeVoiceClip,
} from "./lib/voice-worker-client";

const profile =
  process.env.NEXT_PUBLIC_VOICE_CLIP_PROFILE?.trim() ||
  process.env.VOICE_CLIP_PROFILE?.trim() ||
  "kokoro-bm-george";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const workerUrl = await assertVoiceWorkerReady();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const clips = getX01MatchVoiceClipSeedEntries();
  console.log(`Seeding ${clips.length} X01 commentary clips under ${profile}/ …`);

  for (const clip of clips) {
    const storagePath = `${profile}/${clip.storagePath}`;
    const audio = await synthesizeVoiceClip(workerUrl, clip.phrase);
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
