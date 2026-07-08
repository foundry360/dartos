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

function buildGameOnPhrase(playerName) {
  return `Game On - ${sanitizePlayerName(playerName)} To Throw`;
}

function slugify(playerName) {
  return sanitizePlayerName(playerName).toLowerCase().replace(/\s+/g, "-");
}

function run(command) {
  execSync(command, { stdio: "pipe" });
}

function generateClip(slug, text) {
  const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/sounds/game-on");
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
  console.error("generate-game-on-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

const names = process.argv.slice(2).map((entry) => entry.trim()).filter(Boolean);

if (names.length === 0) {
  console.error('Usage: npm run generate-game-on-clips -- JayDog "Player 2"');
  process.exit(1);
}

const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/sounds/game-on");
await mkdir(outputDir, { recursive: true });

for (const name of names) {
  generateClip(slugify(name), buildGameOnPhrase(name));
}

console.log(`Done. Voice=${voice}`);
