#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/scores");
const voice = process.env.SCORE_CLIP_VOICE?.trim() || "Daniel (English (UK))";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

const RECOMMENDED_VOICES = [
  "Samantha",
  "Kathy",
  "Flo (English (US))",
  "Eddy (English (US))",
  "Reed (English (US))",
  "Rocko (English (US))",
  "Sandy (English (US))",
  "Shelley (English (US))",
  "Daniel (English (UK))",
  "Flo (English (UK))",
  "Eddy (English (UK))",
  "Reed (English (UK))",
  "Rocko (English (UK))",
  "Sandy (English (UK))",
  "Shelley (English (UK))",
  "Moira (English (Ireland))",
  "Karen",
  "Tessa (English (South Africa))",
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
  console.error("generate-score-clips requires macOS `say` and `afconvert`.");
  process.exit(1);
}

if (process.argv.includes("--list-voices")) {
  console.log("Recommended score voices:");
  for (const entry of RECOMMENDED_VOICES) {
    console.log(`  - ${entry}`);
  }
  console.log("\nPreview samples: npm run preview-score-voices");
  console.log('Regenerate all clips: SCORE_CLIP_VOICE="Moira" npm run generate-score-clips');
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });

generateClip("no-score", "No score");

for (let score = 0; score <= 180; score += 1) {
  generateClip(String(score), String(score));
}

console.log(`Done. Generated visit score clips in ${outputDir}`);
