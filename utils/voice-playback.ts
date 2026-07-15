import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
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

export function getAppAudioContext(): AudioContext | null {
  return getSharedAudioContext();
}

export async function resumeAppAudioContext(): Promise<boolean> {
  const audioContext = getSharedAudioContext();
  if (!audioContext) {
    return false;
  }

  if (audioContext.state === "running") {
    return true;
  }

  try {
    await audioContext.resume();
  } catch {
    return false;
  }

  return getSharedAudioContext()?.state === "running";
}

/**
 * Must be kicked from a user gesture. Resumes AudioContext first (works for later
 * programmatic clip playback and SFX on iOS/PWA), then tries a silent HTMLAudio unlock.
 */
export function unlockVoicePlayback(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (voicePlaybackUnlocked) {
    // Keep the shared context alive — iOS may suspend it after navigation.
    void resumeAppAudioContext();
    return Promise.resolve(true);
  }

  if (unlockInFlight) {
    return unlockInFlight;
  }

  // Kick resume on the gesture stack before any other awaits in callers.
  const resumePromise = resumeAppAudioContext();

  unlockInFlight = (async () => {
    try {
      const contextRunning = await resumePromise;
      const audioContext = getSharedAudioContext();

      let htmlUnlocked = false;
      try {
        const audio = getPlaybackAudioElement();
        audio.volume = 0.001;
        audio.src = SILENT_WAV;
        audio.load();
        htmlUnlocked = await playAudioWithTimeout(audio, UNLOCK_PLAY_TIMEOUT_MS);
        if (htmlUnlocked) {
          audio.pause();
          audio.currentTime = 0;
        }
      } catch {
        // AudioContext path may still work.
      }

      if (htmlUnlocked || contextRunning || audioContext?.state === "running") {
        voicePlaybackUnlocked = true;
        return true;
      }

      return false;
    } finally {
      unlockInFlight = null;
    }
  })();

  return unlockInFlight;
}

function stopBufferSource(): void {
  if (!activeBufferSource) {
    return;
  }

  try {
    activeBufferSource.stop();
  } catch {
    // Already stopped.
  }

  try {
    activeBufferSource.disconnect();
  } catch {
    // Already disconnected.
  }

  activeBufferSource = null;
}

export function stopVoicePlayback(): void {
  cancelFreeSpeech();
  stopBufferSource();

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
  if (activeBufferSource != null) {
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

async function playVoiceBlobViaAudioContext(
  blob: Blob,
  audioContext: AudioContext,
  playbackRate: number,
  volume: number,
): Promise<boolean> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  return new Promise<boolean>((resolve) => {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    gain.gain.value = volume;
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    source.connect(gain);
    gain.connect(audioContext.destination);

    activeBufferSource = source;

    const finish = (ok: boolean) => {
      if (activeBufferSource === source) {
        activeBufferSource = null;
      }

      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        // Already disconnected.
      }

      resolve(ok);
    };

    source.onended = () => finish(true);

    try {
      source.start(0);
      voicePlaybackUnlocked = true;
    } catch {
      finish(false);
    }
  });
}

async function playVoiceBlobViaHtmlAudio(
  blob: Blob,
  playbackRate: number,
  volume: number,
): Promise<boolean> {
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

export async function playVoiceBlob(blob: Blob, playbackRate = 1, volume = 0.95): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  await unlockVoicePlayback();

  if (!(await resumeAppAudioContext())) {
    // Continue — HTMLAudio unlock may still be enough for clips.
  }

  const audioContext = getSharedAudioContext();
  stopVoicePlayback();

  // Prefer Web Audio: once resumed during a gesture, clips can play after network
  // fetch without waiting for another tap (fixes iOS HTMLAudio "plays on back").
  if (audioContext?.state === "running") {
    try {
      if (await playVoiceBlobViaAudioContext(blob, audioContext, playbackRate, volume)) {
        return true;
      }
    } catch {
      // Fall through to HTMLAudioElement.
    }
  }

  return playVoiceBlobViaHtmlAudio(blob, playbackRate, volume);
}
