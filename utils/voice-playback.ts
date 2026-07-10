import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let playbackQueue: Promise<void> = Promise.resolve();
let voicePlaybackGeneration = 0;
let voicePlaybackUnlocked = false;
let sharedAudioContext: AudioContext | null = null;
/** Reused after a successful gesture unlock — required for iOS/PWA programmatic playback. */
let gestureUnlockedAudio: HTMLAudioElement | null = null;

/** Minimal silent WAV so the browser allows later HTMLAudio playback. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

const UNLOCK_PLAY_TIMEOUT_MS = 1_500;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

async function playAudioWithTimeout(audio: HTMLAudioElement, timeoutMs: number): Promise<boolean> {
  try {
    await Promise.race([
      audio.play(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Audio play timed out")), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function waitForCanPlay(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("error", onError);
      window.clearTimeout(timeoutId);
    };

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Voice clip failed to load"));
    };

    const timeoutId = window.setTimeout(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        onReady();
        return;
      }

      onError();
    }, 8000);

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("canplay", onReady, { once: true });
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

function getPlaybackAudioElement(): HTMLAudioElement {
  if (!gestureUnlockedAudio) {
    gestureUnlockedAudio = new Audio();
  }

  return gestureUnlockedAudio;
}

export function isVoicePlaybackUnlocked(): boolean {
  return voicePlaybackUnlocked;
}

let unlockInFlight: Promise<boolean> | null = null;

export function unlockVoicePlayback(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (voicePlaybackUnlocked) {
    return Promise.resolve(true);
  }

  if (unlockInFlight) {
    return unlockInFlight;
  }

  unlockInFlight = (async () => {
    try {
      const audioContext = getSharedAudioContext();
      if (audioContext?.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {
          // Continue with HTMLAudioElement unlock attempt.
        }
      }

      const audio = getPlaybackAudioElement();
      audio.volume = 0.001;
      audio.src = SILENT_WAV;
      audio.load();

      const played = await playAudioWithTimeout(audio, UNLOCK_PLAY_TIMEOUT_MS);
      if (!played) {
        return false;
      }

      voicePlaybackUnlocked = true;
      audio.pause();
      audio.currentTime = 0;
      return true;
    } finally {
      unlockInFlight = null;
    }
  })();

  return unlockInFlight;
}

export function stopVoicePlayback(): void {
  cancelFreeSpeech();

  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.currentTime = 0;

  if (activeAudio !== gestureUnlockedAudio) {
    activeAudio = null;
  }
}

/** Stop playback and drop any queued or in-flight match announcements. */
export function cancelVoiceAnnouncements(): void {
  voicePlaybackGeneration += 1;
  stopVoicePlayback();
  playbackQueue = Promise.resolve();
}

export function getVoicePlaybackGeneration(): number {
  return voicePlaybackGeneration;
}

export function isVoicePlaybackCancelled(sinceGeneration: number): boolean {
  return sinceGeneration !== voicePlaybackGeneration;
}

export function isVoicePlaybackActive(): boolean {
  return activeAudio != null && !activeAudio.paused && !activeAudio.ended;
}

export function enqueueVoicePlayback<T>(task: () => Promise<T>): Promise<T> {
  const generationAtEnqueue = voicePlaybackGeneration;
  const run = playbackQueue.then(async () => {
    if (generationAtEnqueue !== voicePlaybackGeneration) {
      return undefined as T;
    }

    const result = await task();

    if (generationAtEnqueue !== voicePlaybackGeneration) {
      return undefined as T;
    }

    return result;
  });
  playbackQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Resolves when all queued voice clips have finished playing. */
export function awaitVoicePlaybackQueue(): Promise<void> {
  return playbackQueue.then(() => undefined);
}

export async function playVoiceBlob(blob: Blob, playbackRate = 1, volume = 0.95): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  await unlockVoicePlayback();

  const audioContext = getSharedAudioContext();
  if (audioContext?.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      // Continue with HTMLAudioElement playback attempt.
    }
  }

  stopVoicePlayback();

  const objectUrl = URL.createObjectURL(blob);
  const audio = getPlaybackAudioElement();
  audio.src = objectUrl;
  audio.preload = "auto";
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  audio.preservesPitch = true;
  activeAudio = audio;

  try {
    await waitForCanPlay(audio);

    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        if (failed) {
          reject(new Error("Voice clip playback failed"));
          return;
        }

        resolve();
      };

      audio.onended = () => cleanup(false);
      audio.onerror = () => cleanup(true);
      void audio
        .play()
        .then(() => {
          voicePlaybackUnlocked = true;
        })
        .catch(() => cleanup(true));
    });

    return true;
  } catch {
    if (activeAudio === audio) {
      activeAudio = null;
    }

    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
