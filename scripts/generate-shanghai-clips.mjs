#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/shanghai");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const MAX_ROUNDS = 20;
const MAX_PLAYERS = 4;

const FIXED_CLIPS = [
  { slug: "round-complete", phrase: "Round complete" },
  { slug: "shanghai-achieved", phrase: "Shanghai achieved!" },
  { slug: "final-round-bull", phrase: "Final round — Bull" },
];

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
  console.error("generate-shanghai-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

for (let roundNumber = 1; roundNumber <= MAX_ROUNDS; roundNumber += 1) {
  generateClip(
    `round-${roundNumber}-target-${roundNumber}`,
    `Round ${roundNumber} — Target ${roundNumber}`,
  );
}

for (let playerNumber = 1; playerNumber <= MAX_PLAYERS; playerNumber += 1) {
  generateClip(`player-${playerNumber}-wins`, `Player ${playerNumber} wins!`);
}

console.log(`Done. Generated shanghai clips in ${outputDir}`);
