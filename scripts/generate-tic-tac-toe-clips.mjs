#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/tic-tac-toe");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const FIXED_CLIPS = [
  { slug: "tic-tac-toe", phrase: "Tic Tac Toe" },
  { slug: "your-targets-are-displayed", phrase: "Your targets are displayed" },
  { slug: "square-claimed", phrase: "Square claimed" },
  { slug: "already-claimed", phrase: "Already claimed" },
  { slug: "no-claim", phrase: "No claim" },
  { slug: "three-in-a-row", phrase: "Three in a row" },
  { slug: "game-complete", phrase: "Game complete" },
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
  console.error("generate-tic-tac-toe-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

for (let playerNumber = 1; playerNumber <= 2; playerNumber += 1) {
  generateClip(`player-${playerNumber}-starts`, `Player ${playerNumber} starts`);
  generateClip(`player-${playerNumber}-wins`, `Player ${playerNumber} wins`);
}

console.log(`Done. Generated Tic Tac Toe clips in ${outputDir}`);
