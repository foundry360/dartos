import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const port = Number(process.env.PORT?.trim() || "8787");
const voiceEngine =
  process.env.VOICE_ENGINE?.trim() ||
  (process.platform === "darwin" ? "mac" : "kokoro");
const kokoroUrl = (process.env.KOKORO_URL?.trim() || "http://kokoro:7860").replace(
  /\/+$/,
  "",
);
const kokoroVoice = process.env.KOKORO_VOICE?.trim() || "bm_george";
const piperBin = process.env.PIPER_BIN?.trim() || "piper";
const piperModelPath = process.env.PIPER_MODEL_PATH?.trim() || "";
const macVoice = process.env.LOCAL_SAY_TURN_VOICE?.trim() || "Daniel (English (UK))";
const macRate = process.env.LOCAL_SAY_TURN_RATE?.trim() || "168";
const authToken = process.env.VOICE_SYNTHESIS_TOKEN?.trim() || "";

function synthesizeMacSay(text) {
  const dir = mkdtempSync(path.join(tmpdir(), "dartos-voice-worker-"));
  const aiffPath = path.join(dir, "clip.aiff");
  const wavPath = path.join(dir, "clip.wav");

  try {
    execFileSync("say", ["-v", macVoice, "-r", macRate, "-o", aiffPath, text], {
      stdio: "pipe",
    });
    execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16", aiffPath, wavPath], {
      stdio: "pipe",
    });

    if (!existsSync(wavPath)) {
      throw new Error("macOS say conversion failed");
    }

    return readFileSync(wavPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function synthesizePiper(text) {
  if (!piperModelPath) {
    throw new Error("PIPER_MODEL_PATH is required for Piper synthesis");
  }

  const dir = mkdtempSync(path.join(tmpdir(), "dartos-voice-worker-"));
  const wavPath = path.join(dir, "clip.wav");

  try {
    execFileSync(piperBin, ["--model", piperModelPath, "--output_file", wavPath], {
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

async function synthesizeKokoro(text) {
  const response = await fetch(`${kokoroUrl}/tts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: kokoroVoice,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message.trim() || `Kokoro synthesis failed (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function synthesize(text) {
  if (voiceEngine === "mac") {
    return synthesizeMacSay(text);
  }

  if (voiceEngine === "piper") {
    return synthesizePiper(text);
  }

  if (voiceEngine === "kokoro") {
    return synthesizeKokoro(text);
  }

  throw new Error(`Unsupported VOICE_ENGINE: ${voiceEngine}`);
}

function isAuthorized(request) {
  if (!authToken) {
    return true;
  }

  const header = request.headers.authorization?.trim();
  return header === `Bearer ${authToken}`;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    let kokoroOk = true;

    if (voiceEngine === "kokoro") {
      try {
        const statusResponse = await fetch(`${kokoroUrl}/tts/status`);
        kokoroOk = statusResponse.ok;
      } catch {
        kokoroOk = false;
      }
    }

    response.writeHead(kokoroOk ? 200 : 503, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: kokoroOk,
        engine: voiceEngine,
        voice: voiceEngine === "kokoro" ? kokoroVoice : undefined,
      }),
    );
    return;
  }

  if (request.method !== "POST" || request.url !== "/synthesize") {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (!isAuthorized(request)) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  try {
    const body = await readJsonBody(request);
    const text = body?.text?.trim();

    if (!text) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Missing text" }));
      return;
    }

    const audio = await synthesize(text);
    response.writeHead(200, {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    });
    response.end(audio);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Synthesis failed";
    console.error("[voice-worker]", message);
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: message }));
  }
}).listen(port, () => {
  console.log(
    `[voice-worker] listening on :${port} (engine=${voiceEngine}${
      voiceEngine === "kokoro" ? `, voice=${kokoroVoice}` : ""
    })`,
  );
});
