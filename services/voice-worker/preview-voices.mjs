#!/usr/bin/env node
/**
 * Generate sample darts callouts for several Piper voices.
 * Run on the VPS (inside the voice-worker folder):
 *
 *   docker compose run --rm voice-worker node preview-voices.mjs
 *
 * Open the `previews/` folder and listen — pick one, then set PIPER_MODEL_PATH
 * in docker-compose.yml and NEXT_PUBLIC_VOICE_CLIP_PROFILE on Vercel.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const piperBin = process.env.PIPER_BIN?.trim() || "piper";
const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "previews");

const samples = [
  "JayDog, you're up.",
  "Game On - Mike To Throw",
];

/** Hugging Face rhasspy/piper-voices — British/US males worth comparing to Alan. */
const voices = [
  {
    id: "en-gb-northern-english-male",
    label: "Northern English Male (UK — current default)",
    modelUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx",
    configUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx.json",
  },
  {
    id: "en-gb-alan",
    label: "Alan (UK — previous default)",
    modelUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
    configUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json",
  },
  {
    id: "en-gb-cori-high",
    label: "Cori High (UK — clearer, higher quality)",
    modelUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx",
    configUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high/en_GB-cori-high.onnx.json",
  },
  {
    id: "en-us-lessac",
    label: "Lessac (US — arena announcer style)",
    modelUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    configUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
  },
  {
    id: "en-us-ryan",
    label: "Ryan (US — deep male)",
    modelUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
    configUrl:
      "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json",
  },
];

function download(url, dest) {
  execFileSync("curl", ["-fsSL", "-o", dest, url], { stdio: "pipe" });
}

function synthesize(modelPath, text, wavPath) {
  execFileSync(piperBin, ["--model", modelPath, "--output_file", wavPath], {
    input: text,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

mkdirSync(outputDir, { recursive: true });

for (const voice of voices) {
  const workDir = mkdtempSync(path.join(tmpdir(), "dartos-preview-"));
  const modelPath = path.join(workDir, "model.onnx");

  try {
    console.log(`\n${voice.label}`);
    download(voice.modelUrl, modelPath);
    download(voice.configUrl, `${modelPath}.json`);

    for (const [index, text] of samples.entries()) {
      const slug = index === 0 ? "turn" : "game-on";
      const wavPath = path.join(outputDir, `${voice.id}-${slug}.wav`);
      synthesize(modelPath, text, wavPath);
      console.log(`  wrote ${path.basename(wavPath)}`);
    }
  } catch (error) {
    console.error(`  failed: ${error instanceof Error ? error.message : error}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

const readme = `# Piper voice previews

Listen to these in order. Pick the voice profile id for Vercel (\`NEXT_PUBLIC_VOICE_CLIP_PROFILE\`).

| File prefix | Voice |
|---|---|
${voices.map((v) => `| \`${v.id}\` | ${v.label} |`).join("\n")}

More samples: https://rhasspy.github.io/piper-samples/
`;

writeFileSync(path.join(outputDir, "README.md"), readme);
console.log(`\nDone. Open: ${outputDir}`);
