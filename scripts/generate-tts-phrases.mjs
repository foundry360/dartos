import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PHRASES = {
  "voice-test": "Voice announcements enabled.",
};

const apiKey = process.env.GOOGLE_GEMINI_API_KEY?.trim();
const modelName =
  process.env.GOOGLE_GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";
const voiceName = process.env.GOOGLE_CLOUD_TTS_VOICE?.trim() || "Sadachbia";
const prompt =
  process.env.GOOGLE_CLOUD_TTS_PROMPT?.trim() ||
  "Calm professional darts announcer. Normal speaking volume. Even pace. Never shout, scream, or yell. Speak only the line after the colon, using the same neutral delivery every time";

if (!apiKey) {
  console.error("Missing GOOGLE_GEMINI_API_KEY.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wrapPcm16InWav(pcm, sampleRate = 24000, channels = 1) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bytesPerSample * 8, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

async function synthesizeWav(text, attempt = 1) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${prompt}:\n${text}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    const message = payload.error?.message || "Gemini TTS request failed";
    const retryMatch = message.match(/retry in ([0-9.]+)s/i);

    if (retryMatch && attempt < 5) {
      const waitMs = Math.ceil(Number(retryMatch[1]) * 1000) + 500;
      console.log(`Rate limited, waiting ${waitMs}ms before retry...`);
      await sleep(waitMs);
      return synthesizeWav(text, attempt + 1);
    }

    throw new Error(message);
  }

  const inlineData = payload.candidates?.[0]?.content?.parts?.[0]?.inlineData;

  if (!inlineData?.data) {
    throw new Error("Gemini TTS returned no audio");
  }

  return wrapPcm16InWav(Buffer.from(inlineData.data, "base64"));
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../public/sounds");

await mkdir(outputDir, { recursive: true });

for (const [filename, text] of Object.entries(PHRASES)) {
  const audio = await synthesizeWav(text);
  const outputPath = path.join(outputDir, `${filename}.wav`);
  await writeFile(outputPath, audio);
  console.log(`Wrote ${outputPath}`);
  await sleep(8000);
}

console.log(`Done. Model=${modelName} Voice=${voiceName}`);
