import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let playbackQueue: Promise<void> = Promise.resolve();

function waitForCanPlay(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
    };

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Voice clip failed to load"));
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
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

export function isVoicePlaybackActive(): boolean {
  return activeAudio != null && !activeAudio.paused && !activeAudio.ended;
}

export function enqueueVoicePlayback<T>(task: () => Promise<T>): Promise<T> {
  const run = playbackQueue.then(task);
  playbackQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function playVoiceBlob(blob: Blob, playbackRate = 1, volume = 0.95): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

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
