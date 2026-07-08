#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PREVIEW_GROUPS = [
  {
    title: "US English",
    voices: [
      { id: "Samantha", label: "Samantha" },
      { id: "Kathy", label: "Kathy" },
      { id: "Flo (English (US))", label: "Flo" },
      { id: "Eddy (English (US))", label: "Eddy" },
      { id: "Reed (English (US))", label: "Reed" },
      { id: "Rocko (English (US))", label: "Rocko" },
      { id: "Sandy (English (US))", label: "Sandy" },
      { id: "Shelley (English (US))", label: "Shelley" },
      { id: "Grandma (English (US))", label: "Grandma" },
      { id: "Grandpa (English (US))", label: "Grandpa" },
    ],
  },
  {
    title: "UK English",
    voices: [
      { id: "Daniel (English (UK))", label: "Daniel" },
      { id: "Flo (English (UK))", label: "Flo" },
      { id: "Eddy (English (UK))", label: "Eddy" },
      { id: "Reed (English (UK))", label: "Reed" },
      { id: "Rocko (English (UK))", label: "Rocko" },
      { id: "Sandy (English (UK))", label: "Sandy" },
      { id: "Shelley (English (UK))", label: "Shelley" },
      { id: "Grandma (English (UK))", label: "Grandma" },
      { id: "Grandpa (English (UK))", label: "Grandpa" },
      { id: "Moira (English (Ireland))", label: "Moira (Ireland)" },
    ],
  },
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds/score-previews");
const sampleText = process.env.SCORE_CLIP_PREVIEW_TEXT?.trim() || "140";
const rate = process.env.SCORE_CLIP_RATE?.trim() || "168";

function run(command) {
  execSync(command, { stdio: "pipe" });
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generatePreview(voice) {
  const filename = `${slugify(voice)}-${sampleText}.wav`;
  const wavPath = path.join(outputDir, filename);
  const tmpAiff = path.join(outputDir, `.tmp-${slugify(voice)}.aiff`);

  run(`say -v "${voice}" -r ${rate} -o "${tmpAiff}" "${sampleText}"`);
  run(`afconvert -f WAVE -d LEI16 "${tmpAiff}" "${wavPath}"`);

  if (existsSync(tmpAiff)) {
    unlinkSync(tmpAiff);
  }

  return {
    filename,
    url: `/sounds/score-previews/${filename}`,
  };
}

if (process.platform !== "darwin") {
  console.error("preview-score-voices requires macOS `say` and `afconvert`.");
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

const indexEntries = [];

console.log(`Sample phrase: "${sampleText}" at rate ${rate}\n`);

for (const group of PREVIEW_GROUPS) {
  console.log(group.title);
  console.log("─".repeat(group.title.length));

  for (const entry of group.voices) {
    const preview = generatePreview(entry.id);
    console.log(`${entry.label}`);
    console.log(`  ${preview.url}`);

    indexEntries.push({
      group: group.title,
      label: entry.label,
      voice: entry.id,
      url: preview.url,
    });
  }

  console.log("");
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DartOS score voice previews</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #111; color: #f5f5f5; }
    h1 { margin-bottom: 0.25rem; }
    p { color: #aaa; }
    section { margin: 2rem 0; }
    h2 { border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    .voice { margin: 1rem 0; padding: 1rem; background: #1b1b1b; border-radius: 12px; }
    .voice strong { display: block; margin-bottom: 0.5rem; }
    code { color: #9ad; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Score voice previews</h1>
  <p>Sample phrase: <strong>${sampleText}</strong>. Pick a voice, then run <code>SCORE_CLIP_VOICE="Voice Name" npm run generate-score-clips</code>.</p>
  ${PREVIEW_GROUPS.map((group) => {
    const items = indexEntries
      .filter((entry) => entry.group === group.title)
      .map(
        (entry) => `<div class="voice">
      <strong>${entry.label}</strong>
      <audio controls preload="none" src="${entry.url}"></audio>
      <code>${entry.voice}</code>
    </div>`,
      )
      .join("");

    return `<section><h2>${group.title}</h2>${items}</section>`;
  }).join("")}
</body>
</html>
`;

writeFileSync(path.join(outputDir, "index.html"), indexHtml);

console.log("Browser compare page:");
console.log("  /sounds/score-previews/index.html");
console.log("\nRegenerate all clips with:");
console.log('  SCORE_CLIP_VOICE="Daniel (English (UK))" npm run generate-score-clips');
