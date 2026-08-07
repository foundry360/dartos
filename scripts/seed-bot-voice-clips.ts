#!/usr/bin/env node
/**
 * Seed George turn + Game On clips for all bot difficulty display names.
 *
 * Run:
 *   npm run seed-bot-voice-clips
 */
import { createClient } from "@supabase/supabase-js";
import { getBotDisplayNames } from "../features/bot/lib/bot-profiles";
import { buildGameOnPhrase } from "../lib/game-on-callouts";
import {
  buildGameOnClipStoragePath,
  buildTurnClipStoragePath,
} from "../lib/voice-clips/paths";
import { buildPlayerTurnPhraseText } from "../utils/player-turn-audio";

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

  const botNames = getBotDisplayNames();
  console.log(`Seeding ${botNames.length * 2} bot voice clips …`);

  for (const name of botNames) {
    const turnPath = buildTurnClipStoragePath(name);
    const turnPhrase = buildPlayerTurnPhraseText(name);
    const turnAudio = await synthesize(turnPhrase);
    const turnUpload = await supabase.storage.from("voice-clips").upload(turnPath, turnAudio, {
      upsert: true,
      contentType: "audio/wav",
      cacheControl: "31536000",
    });

    if (turnUpload.error) {
      console.error(`Failed to upload ${turnPath}:`, turnUpload.error.message);
      process.exit(1);
    }

    console.log(`✓ turn  ${turnPath}`);

    const gameOnPath = buildGameOnClipStoragePath(name);
    const gameOnPhrase = buildGameOnPhrase(name);
    const gameOnAudio = await synthesize(gameOnPhrase);
    const gameOnUpload = await supabase.storage.from("voice-clips").upload(gameOnPath, gameOnAudio, {
      upsert: true,
      contentType: "audio/wav",
      cacheControl: "31536000",
    });

    if (gameOnUpload.error) {
      console.error(`Failed to upload ${gameOnPath}:`, gameOnUpload.error.message);
      process.exit(1);
    }

    console.log(`✓ game-on  ${gameOnPath}`);
  }

  console.log("Done.");
}

void main();
