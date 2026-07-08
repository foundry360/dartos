#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/bobs-27");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const MAX_DOUBLE_TARGET = 20;
const MAX_PLAYERS = 8;

const FIXED_CLIPS = [
  { slug: "starting-score-27", phrase: "Starting score: 27" },
  { slug: "final-target-bull", phrase: "Final target: Bull" },
  { slug: "round-complete", phrase: "Round complete" },
  { slug: "score-reduced", phrase: "Score reduced" },
  { slug: "player-eliminated", phrase: "Player eliminated" },
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
  console.error("generate-bobs-27-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

for (let segment = 1; segment <= MAX_DOUBLE_TARGET; segment += 1) {
  generateClip(`target-double-${segment}`, `Target: Double ${segment}`);
}

for (let playerNumber = 1; playerNumber <= MAX_PLAYERS; playerNumber += 1) {
  generateClip(
    `game-complete-player-${playerNumber}`,
    `Game complete — Player ${playerNumber} wins`,
  );
}

console.log(`Done. Generated Bob's 27 clips in ${outputDir}`);
