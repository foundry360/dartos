#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const voice = process.env.LOCAL_SAY_TURN_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.LOCAL_SAY_TURN_RATE?.trim() || "168";

function sanitizePlayerName(name) {
  const trimmed = name.trim().replace(/\s+/g, " ").slice(0, 48);
  if (!trimmed) {
    return "Player";
  }

  const cleaned = trimmed.replace(/[^\p{L}\p{N}' .-]/gu, "");
  return cleaned || "Player";
}

function buildPlayerTurnPhrase(playerName) {
  return `${sanitizePlayerName(playerName)}, you're up.`;
}

function slugify(playerName) {
  return sanitizePlayerName(playerName).toLowerCase().replace(/\s+/g, "-");
}

function run(command) {
  execSync(command, { stdio: "pipe" });
}

function generateClip(slug, text) {
  const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/sounds/turns");
  const wavPath = path.join(outputDir, `${slug}.wav`);
  const tmpAiff = path.join(outputDir, `.tmp-${slug}.aiff`);

  run(`say -v "${voice}" -r ${rate} -o "${tmpAiff}" "${text}"`);
  run(`afconvert -f WAVE -d LEI16 "${tmpAiff}" "${wavPath}"`);

  if (existsSync(tmpAiff)) {
    unlinkSync(tmpAiff);
  }

  console.log(`Wrote ${wavPath}`);
}

if (process.platform !== "darwin") {
  console.error("generate-player-turn-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

const names = process.argv.slice(2).map((entry) => entry.trim()).filter(Boolean);

if (names.length === 0) {
  console.error('Usage: npm run generate-player-turn-clips -- "JayDog" "Mike"');
  console.error("Use each player's scorecard name (nickname if set, otherwise legal name).");
  process.exit(1);
}

const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/sounds/turns");
await mkdir(outputDir, { recursive: true });

for (const name of names) {
  generateClip(slugify(name), buildPlayerTurnPhrase(name));
}

console.log(`Done. Voice=${voice}`);
