import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let activeWebAudioSource: AudioBufferSourceNode | null = null;
let activeObjectUrl: string | null = null;
let playbackQueue: Promise<void> = Promise.resolve();
let voicePlaybackGeneration = 0;
let voicePlaybackUnlocked = false;
let sharedAudioContext: AudioContext | null = null;
/** HTMLAudioElement that successfully played on a user gesture — reused on iOS/PWA. */
let gestureUnlockedAudio: HTMLAudioElement | null = null;

/** Minimal silent WAV so the browser allows later HTMLAudio playback. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

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

function isWebAudioReady(): boolean {
  return getSharedAudioContext()?.state === "running";
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

export function isVoicePlaybackUnlocked(): boolean {
  return voicePlaybackUnlocked || isWebAudioReady();
}

let unlockInFlight: Promise<boolean> | null = null;

export function unlockVoicePlayback(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (isVoicePlaybackUnlocked()) {
    voicePlaybackUnlocked = true;
    return Promise.resolve(true);
  }

  if (unlockInFlight) {
    return unlockInFlight;
  }

  unlockInFlight = (async () => {
    try {
      const audioContext = getSharedAudioContext();
      if (audioContext?.state === "running") {
        voicePlaybackUnlocked = true;
        return true;
      }

      if (audioContext?.state === "suspended") {
        try {
          await audioContext.resume();
          voicePlaybackUnlocked = true;
          return true;
        } catch {
          // Continue with HTMLAudioElement unlock attempt.
        }
      }

      const audio = gestureUnlockedAudio ?? new Audio(SILENT_WAV);
      if (!gestureUnlockedAudio) {
        gestureUnlockedAudio = audio;
      }

      audio.volume = 0.001;
      if (audio.src !== SILENT_WAV) {
        audio.src = SILENT_WAV;
      }

      try {
        await audio.play();
        voicePlaybackUnlocked = true;
        audio.pause();
        audio.currentTime = 0;
        return true;
      } catch {
        return isWebAudioReady();
      }
    } finally {
      unlockInFlight = null;
    }
  })();

  return unlockInFlight;
}

export function stopVoicePlayback(): void {
  cancelFreeSpeech();

  if (activeWebAudioSource) {
    try {
      activeWebAudioSource.stop();
    } catch {
      // Already stopped.
    }

    activeWebAudioSource = null;
  }

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;

    if (activeAudio !== gestureUnlockedAudio) {
      activeAudio = null;
    }
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
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
  if (activeWebAudioSource) {
    return true;
  }

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

async function playViaWebAudio(blob: Blob, playbackRate: number, volume: number): Promise<boolean> {
  const audioContext = getSharedAudioContext();
  if (!audioContext || audioContext.state !== "running") {
    return false;
  }

  let audioBuffer: AudioBuffer;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(audioContext.destination);

    activeWebAudioSource = source;
    let settled = false;

    const finish = (success: boolean) => {
      if (settled) {
        return;
      }

      settled = true;

      if (activeWebAudioSource === source) {
        activeWebAudioSource = null;
      }

      resolve(success);
    };

    source.onended = () => finish(true);

    try {
      source.start(0);
    } catch {
      finish(false);
    }
  });
}

async function playViaHtmlAudio(blob: Blob, playbackRate: number, volume: number): Promise<boolean> {
  const audio = gestureUnlockedAudio ?? new Audio();
  if (!gestureUnlockedAudio) {
    gestureUnlockedAudio = audio;
  }

  const objectUrl = URL.createObjectURL(blob);
  activeObjectUrl = objectUrl;
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  audio.preservesPitch = true;
  audio.src = objectUrl;
  activeAudio = audio;

  try {
    await waitForCanPlay(audio);

    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        if (activeObjectUrl === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          activeObjectUrl = null;
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

    if (activeObjectUrl === objectUrl) {
      URL.revokeObjectURL(objectUrl);
      activeObjectUrl = null;
    }

    return false;
  }
}

export async function playVoiceBlob(blob: Blob, playbackRate = 1, volume = 0.95): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const unlocked = await unlockVoicePlayback();
  const audioContext = getSharedAudioContext();

  if (audioContext?.state === "suspended") {
    try {
      await audioContext.resume();
      voicePlaybackUnlocked = true;
    } catch {
      // Continue with playback attempt.
    }
  }

  if (!unlocked && !isVoicePlaybackUnlocked()) {
    return false;
  }

  stopVoicePlayback();

  if (await playViaWebAudio(blob, playbackRate, volume)) {
    return true;
  }

  return playViaHtmlAudio(blob, playbackRate, volume);
}
