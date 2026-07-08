export function getGoogleCloudTtsApiKey(): string | null {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY?.trim();
  return apiKey || null;
}

export function getGoogleGeminiApiKey(): string | null {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY?.trim();
  return apiKey || null;
}

const GEMINI_VOICES = new Set([
  "Achernar",
  "Achird",
  "Algenib",
  "Algieba",
  "Alnilam",
  "Aoede",
  "Autonoe",
  "Callirrhoe",
  "Charon",
  "Despina",
  "Enceladus",
  "Erinome",
  "Fenrir",
  "Gacrux",
  "Iapetus",
  "Kore",
  "Laomedeia",
  "Leda",
  "Orus",
  "Puck",
  "Pulcherrima",
  "Rasalgethi",
  "Sadachbia",
  "Sadaltager",
  "Schedar",
  "Sulafat",
  "Umbriel",
  "Vindemiatrix",
  "Zephyr",
  "Zubenelgenubi",
]);

export function isGeminiVoiceName(voiceName: string): boolean {
  return GEMINI_VOICES.has(voiceName);
}

export function getGeminiTtsApiKey(): string | null {
  return getGoogleGeminiApiKey() || getGoogleCloudTtsApiKey();
}

export function isGoogleCloudTtsConfigured(): boolean {
  const voice = getGoogleCloudTtsVoiceName();

  if (isGeminiVoiceName(voice)) {
    return Boolean(getGeminiTtsApiKey());
  }

  return Boolean(getGoogleCloudTtsApiKey());
}

export function getGoogleCloudTtsModelName(): string {
  return process.env.GOOGLE_CLOUD_TTS_MODEL?.trim() || "gemini-2.5-pro-tts";
}

export function getGoogleCloudTtsVoiceName(): string {
  const configured = process.env.GOOGLE_CLOUD_TTS_VOICE?.trim() || "Sadachbia";

  if (GEMINI_VOICES.has(configured)) {
    return configured;
  }

  // Ignore legacy Neural2 / Wavenet voice names from older config.
  return "Sadachbia";
}

const DEFAULT_GOOGLE_CLOUD_TTS_PROMPT =
  "Crisp darts arena announcer at a brisk conversational pace. Same energy and cadence every line. Never shout. Speak only the text after the colon";

function isUsableTtsPrompt(value: string | undefined): value is string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return false;
  }

  // Unquoted .env values or stale shell exports often truncate to a single word (e.g. "Sports").
  if (!trimmed.includes(" ") || trimmed.length < 40) {
    return false;
  }

  return true;
}

export function getGoogleCloudTtsPrompt(): string {
  const configured = process.env.GOOGLE_CLOUD_TTS_PROMPT;

  if (isUsableTtsPrompt(configured)) {
    return configured.trim();
  }

  return DEFAULT_GOOGLE_CLOUD_TTS_PROMPT;
}

/** Classic Cloud TTS speaking rate (unused for Gemini voices). */
export function getGoogleCloudTtsSpeakingRate(): number {
  const configured = Number(process.env.GOOGLE_CLOUD_TTS_SPEAKING_RATE);
  return Number.isFinite(configured) && configured > 0 ? configured : 1;
}

/** Browser playback speed for Gemini / all DartOS voice clips. */
export function getClientPlaybackRate(): number {
  const configured = Number(process.env.NEXT_PUBLIC_TTS_PLAYBACK_RATE);
  if (Number.isFinite(configured) && configured >= 0.8 && configured <= 1.5) {
    return configured;
  }

  return 1.08;
}

export function getGoogleCloudTtsPitch(): number {
  const configured = Number(process.env.GOOGLE_CLOUD_TTS_PITCH);
  return Number.isFinite(configured) ? configured : 0;
}

export function getGeminiApiTtsModelName(): string {
  return process.env.GOOGLE_GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";
}

export function getTtsCacheRevision(): string {
  const voice = getGoogleCloudTtsVoiceName();
  const model = isGeminiVoiceName(voice)
    ? getGeminiApiTtsModelName()
    : getGoogleCloudTtsModelName();
  const rate = getClientPlaybackRate().toFixed(2);
  return `gemini-api:${model}:${voice}:r${rate}`;
}

export function getTtsCacheGeneration(): string {
  return `v13:${getTtsCacheRevision()}`;
}
