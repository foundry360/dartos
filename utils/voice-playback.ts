import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let playbackQueue: Promise<void> = Promise.resolve();
let voicePlaybackGeneration = 0;
let voicePlaybackUnlocked = false;

/** Minimal silent WAV so the browser allows later HTMLAudio playback. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

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

export function unlockVoicePlayback(): void {
  if (voicePlaybackUnlocked || typeof window === "undefined") {
    return;
  }

  const audio = new Audio(SILENT_WAV);
  audio.volume = 0.001;

  void audio
    .play()
    .then(() => {
      voicePlaybackUnlocked = true;
      audio.pause();
    })
    .catch(() => {
      // Will retry on the next user gesture.
    });
}

export function stopVoicePlayback(): void {
  cancelFreeSpeech();

  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;
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

  unlockVoicePlayback();
  stopVoicePlayback();

  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();
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
      void audio.play().catch(() => cleanup(true));
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
