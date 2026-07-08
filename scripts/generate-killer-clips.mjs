#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/killer");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const MAX_PLAYERS = 4;
const MAX_TARGET = 20;

const FIXED_CLIPS = [
  { slug: "player-numbers-assigned", phrase: "Player numbers assigned" },
  { slug: "double-hit-two-lives-removed", phrase: "Double hit — two lives removed" },
  { slug: "player-eliminated", phrase: "Player eliminated" },
];

function formatTarget(target) {
  return target === "bull" ? "Bull" : String(target);
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function generateClip(filename, spokenText) {
  const wavPath = path.join(outputDir, `${filename}.wav`);
  const tmpAiff = path.join(outputDir, `.tmp-${filename}.aiff`);

  run(`say -v "${voice}" -r ${rate} -o "${tmpAiff}" "${spokenText}"`);
  run(`afconvert -f WAVE -d LEI16 "${tmpAiff}" "${wavPath}"`);

  if (existsSync(tmpAiff)) {
    unlinkSync(tmpAiff);
  }

  console.log(`Wrote ${wavPath}`);
}

if (process.platform !== "darwin") {
  console.error("generate-killer-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

for (let playerNumber = 1; playerNumber <= MAX_PLAYERS; playerNumber += 1) {
  for (let target = 1; target <= MAX_TARGET; target += 1) {
    generateClip(
      `player-${playerNumber}-target-${target}`,
      `Player ${playerNumber} target: ${formatTarget(target)}`,
    );
  }

  generateClip(
    `player-${playerNumber}-target-bull`,
    `Player ${playerNumber} target: ${formatTarget("bull")}`,
  );

  generateClip(
    `player-${playerNumber}-is-killer`,
    `Player ${playerNumber} is now a Killer`,
  );

  generateClip(`player-${playerNumber}-wins`, `Player ${playerNumber} wins`);
}

console.log(`Done. Generated killer clips in ${outputDir}`);
