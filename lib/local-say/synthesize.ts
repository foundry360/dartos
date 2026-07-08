import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function synthesizeLocalSay(
  text: string,
  voice: string,
  rate: string,
): Buffer {
  const dir = mkdtempSync(path.join(tmpdir(), "dartos-say-"));
  const aiffPath = path.join(dir, "clip.aiff");
  const wavPath = path.join(dir, "clip.wav");

  try {
    execFileSync("say", ["-v", voice, "-r", rate, "-o", aiffPath, text], {
      stdio: "pipe",
    });
    execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16", aiffPath, wavPath], {
      stdio: "pipe",
    });

    if (!existsSync(wavPath)) {
      throw new Error("Local say conversion failed");
    }

    return readFileSync(wavPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
