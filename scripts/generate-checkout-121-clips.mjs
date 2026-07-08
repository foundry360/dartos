#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/checkout-121");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const MIN_SCORE = 121;
const MAX_SCORE = 170;

const FIXED_CLIPS = [
  { slug: "121-checkout", phrase: "121 Checkout" },
  { slug: "visit-complete", phrase: "Visit complete" },
  { slug: "three-darts-remaining", phrase: "Three darts remaining" },
  { slug: "last-dart", phrase: "Last dart" },
  { slug: "checkout", phrase: "Checkout!" },
  { slug: "checkout-121", phrase: "121 checkout" },
  { slug: "target-cleared", phrase: "Target cleared" },
  { slug: "no-checkout", phrase: "No checkout" },
  { slug: "new-high-score", phrase: "New high score" },
  { slug: "personal-best", phrase: "Personal best" },
  { slug: "challenge-complete", phrase: "Challenge complete" },
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
  console.error("generate-checkout-121-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of FIXED_CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

for (let score = MIN_SCORE; score <= MAX_SCORE; score += 1) {
  generateClip(`starting-target-${score}`, `Starting target: ${score}`);
  generateClip(`remaining-${score}`, `${score} remaining`);
  generateClip(`next-target-${score}`, `Next target: ${score}`);
  generateClip(`target-${score}`, `Target: ${score}`);
  generateClip(`target-remains-${score}`, `Target remains ${score}`);
  generateClip(`highest-checkout-${score}`, `Highest checkout: ${score}`);
}

console.log(`Done. Generated 121 checkout clips in ${outputDir}`);
