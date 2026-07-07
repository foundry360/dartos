import {
  getGeminiApiTtsModelName,
  getGoogleCloudTtsApiKey,
  getGoogleCloudTtsPitch,
  getGoogleCloudTtsPrompt,
  getGoogleCloudTtsSpeakingRate,
  getGoogleCloudTtsVoiceName,
  getGoogleGeminiApiKey,
  isGeminiVoiceName,
} from "@/lib/google-tts/env";
import { synthesizeWithGeminiApi } from "@/lib/google-tts/synthesize-gemini-api";

interface GoogleTtsResponse {
  audioContent?: string;
  error?: {
    message?: string;
  };
}

export interface SynthesizedSpeech {
  audio: Buffer;
  contentType: "audio/mpeg" | "audio/wav";
}

function buildGeminiVoiceSetupError(): Error {
  return new Error(
    "Sadachbia and other Gemini voices require GOOGLE_GEMINI_API_KEY from https://aistudio.google.com/apikey. Your Cloud Text-to-Speech API key cannot access Gemini voices.",
  );
}

async function synthesizeWithCloudClassic(text: string, apiKey: string): Promise<Buffer> {
  const classicVoice =
    process.env.GOOGLE_CLOUD_TTS_CLASSIC_VOICE?.trim() || "en-US-Neural2-J";

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "en-US",
          name: classicVoice,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: getGoogleCloudTtsSpeakingRate(),
          pitch: getGoogleCloudTtsPitch(),
        },
      }),
    },
  );

  const payload = (await response.json()) as GoogleTtsResponse;

  if (!response.ok || !payload.audioContent) {
    throw new Error(payload.error?.message || "Classic Cloud TTS request failed");
  }

  return Buffer.from(payload.audioContent, "base64");
}

async function synthesizeWithGeminiVoice(text: string): Promise<SynthesizedSpeech> {
  const apiKey = getGoogleGeminiApiKey();

  if (!apiKey) {
    throw buildGeminiVoiceSetupError();
  }

  const audio = await synthesizeWithGeminiApi(
    text,
    apiKey,
    getGoogleCloudTtsVoiceName(),
    getGeminiApiTtsModelName(),
    getGoogleCloudTtsPrompt(),
  );

  return { audio, contentType: "audio/wav" };
}

export async function synthesizeSpeech(text: string): Promise<SynthesizedSpeech> {
  const voiceName = getGoogleCloudTtsVoiceName();

  if (isGeminiVoiceName(voiceName)) {
    return synthesizeWithGeminiVoice(text);
  }

  const cloudKey = getGoogleCloudTtsApiKey();

  if (!cloudKey) {
    throw new Error("GOOGLE_CLOUD_TTS_API_KEY is not configured");
  }

  const audio = await synthesizeWithCloudClassic(text, cloudKey);
  return { audio, contentType: "audio/mpeg" };
}

export async function synthesizeSpeechMp3(text: string): Promise<Buffer> {
  const result = await synthesizeSpeech(text);
  return result.audio;
}
