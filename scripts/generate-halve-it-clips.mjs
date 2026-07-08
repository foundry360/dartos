#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/halve-it");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const MAX_ROUND = 20;
const MAX_PLAYERS = 4;

const FIXED_CLIPS = [
  { slug: "final-round-bull", phrase: "Final round — Bull" },
  { slug: "round-complete", phrase: "Round complete" },
  { slug: "no-score-score-halved", phrase: "No score — score halved" },
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
  console.error("generate-halve-it-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

const roundSlugs = new Map();

for (let roundNumber = 1; roundNumber <= MAX_ROUND; roundNumber += 1) {
  roundSlugs.set(`round-${roundNumber}-target-${roundNumber}`, {
    slug: `round-${roundNumber}-target-${roundNumber}`,
    phrase: `Round ${roundNumber} — Target ${roundNumber}`,
  });
}

for (let roundNumber = 1; roundNumber <= 9; roundNumber += 1) {
  const target = roundNumber + 11;
  roundSlugs.set(`round-${roundNumber}-target-${target}`, {
    slug: `round-${roundNumber}-target-${target}`,
    phrase: `Round ${roundNumber} — Target ${target}`,
  });
}

for (const clip of roundSlugs.values()) {
  generateClip(clip.slug, clip.phrase);
}

for (let playerNumber = 1; playerNumber <= MAX_PLAYERS; playerNumber += 1) {
  generateClip(
    `game-complete-player-${playerNumber}`,
    `Game complete — Player ${playerNumber} wins`,
  );
}

console.log(`Done. Generated Halve-It clips in ${outputDir}`);
