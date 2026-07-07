import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENV_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local");
const ENV_NAMES = [
  "GOOGLE_GEMINI_API_KEY",
  "GOOGLE_GEMINI_TTS_MODEL",
  "GOOGLE_CLOUD_TTS_VOICE",
  "GOOGLE_CLOUD_TTS_PROMPT",
];
const TARGETS = ["production", "preview", "development"];

function parseEnvFile(contents) {
  const values = new Map();

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values.set(key, value);
  }

  return values;
}

function addEnv(name, value, target) {
  execFileSync("npx", ["vercel", "env", "add", name, target, "--force"], {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

const envValues = parseEnvFile(readFileSync(ENV_FILE, "utf8"));
const geminiKey = envValues.get("GOOGLE_GEMINI_API_KEY")?.trim();

if (!geminiKey) {
  console.error("Missing GOOGLE_GEMINI_API_KEY in .env.local");
  console.error("Create one at https://aistudio.google.com/apikey and add it to .env.local");
  process.exit(1);
}

for (const name of ENV_NAMES) {
  const value = envValues.get(name)?.trim();
  if (!value) {
    continue;
  }

  for (const target of TARGETS) {
    console.log(`Setting ${name} for ${target}...`);
    addEnv(name, value, target);
  }
}

console.log("Done. Redeploy production with: npx vercel --prod");
