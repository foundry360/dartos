#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/cricket-closed");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const SHARED_CLIPS = [
  { slug: "twenties-closed", phrase: "Twenties closed" },
  { slug: "nineteens-closed", phrase: "Nineteens closed" },
  { slug: "eighteens-closed", phrase: "Eighteens closed" },
  { slug: "seventeens-closed", phrase: "Seventeens closed" },
  { slug: "sixteens-closed", phrase: "Sixteens closed" },
  { slug: "fifteens-closed", phrase: "Fifteens closed" },
  { slug: "bull-closed", phrase: "Bull closed" },
];

const TACTICS_LOW_CLIPS = [
  { slug: "10-closed", phrase: "10 closed" },
  { slug: "11-closed", phrase: "11 closed" },
  { slug: "12-closed", phrase: "12 closed" },
  { slug: "13-closed", phrase: "13 closed" },
  { slug: "14-closed", phrase: "14 closed" },
];

const CLIPS = [...TACTICS_LOW_CLIPS, ...SHARED_CLIPS];

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
  console.error("generate-cricket-closed-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

for (const clip of CLIPS) {
  generateClip(clip.slug, clip.phrase);
}

console.log(`Done. Generated ${CLIPS.length} cricket closed clips in ${outputDir}`);
