function wrapPcm16InWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
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

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function synthesizeWithGeminiApi(
  text: string,
  apiKey: string,
  voiceName: string,
  modelName: string,
  prompt: string,
): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}:\n${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            // Keep delivery as locked as the API allows so every name sounds like the same announcer.
            temperature: 0,
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

    const payload = (await response.json()) as GeminiGenerateContentResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message || "Gemini TTS request failed");
    }

    const inlineData = payload.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!inlineData?.data) {
      throw new Error("Gemini TTS returned no audio");
    }

    const pcm = Buffer.from(inlineData.data, "base64");
    return wrapPcm16InWav(pcm);
  } finally {
    clearTimeout(timeout);
  }
}
