let preferredVoice: SpeechSynthesisVoice | null | undefined;
let voicesReady: Promise<void> | null = null;

function isAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function loadVoices(): Promise<void> {
  if (!isAvailable()) {
    return Promise.resolve();
  }

  const synth = window.speechSynthesis;
  if (synth.getVoices().length > 0) {
    preferredVoice = undefined;
    pickVoice();
    return Promise.resolve();
  }

  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const finish = () => {
        preferredVoice = undefined;
        pickVoice();
        resolve();
      };

      synth.addEventListener("voiceschanged", finish, { once: true });
      window.setTimeout(finish, 300);
    });
  }

  return voicesReady;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isAvailable()) {
    return null;
  }

  if (preferredVoice !== undefined) {
    return preferredVoice;
  }

  const voices = window.speechSynthesis.getVoices();
  preferredVoice =
    voices.find((voice) => voice.lang.startsWith("en") && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith("en-US")) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;

  return preferredVoice;
}

export function primeFreeSpeech(): void {
  void loadVoices();
}

export function cancelFreeSpeech(): void {
  if (!isAvailable()) {
    return;
  }

  window.speechSynthesis.cancel();
}

export async function speakFreePhrase(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !isAvailable()) {
    return;
  }

  await loadVoices();

  const synth = window.speechSynthesis;
  synth.resume();

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearInterval(pollId);
      window.clearTimeout(capId);
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "en-US";
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = finish;
    utterance.onerror = finish;

    let started = false;
    utterance.onstart = () => {
      started = true;
    };

    synth.speak(utterance);

    const pollId = window.setInterval(() => {
      if (started && !synth.speaking && !synth.pending) {
        finish();
      }
    }, 120);

    const capId = window.setTimeout(finish, 2500);
  });
}
