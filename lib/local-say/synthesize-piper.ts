import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PIPER_BIN, PIPER_MODEL_PATH } from "@/lib/local-say/env";

export function synthesizePiper(text: string): Buffer {
  if (!PIPER_MODEL_PATH) {
    throw new Error("PIPER_MODEL_PATH is not configured");
  }

  const dir = mkdtempSync(path.join(tmpdir(), "dartos-piper-"));
  const wavPath = path.join(dir, "clip.wav");

  try {
    execFileSync(PIPER_BIN, ["--model", PIPER_MODEL_PATH, "--output_file", wavPath], {
      input: text,
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!existsSync(wavPath)) {
      throw new Error("Piper synthesis failed");
    }

    return readFileSync(wavPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
