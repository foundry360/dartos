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

/**
 * iOS WebKit does not treat pointerdown as a valid media gesture — need click /
 * touchend / mouseup (or keydown). Capture so unlock runs even if a child
 * stops propagation.
 */
export const IOS_AUDIO_UNLOCK_EVENTS = ["touchend", "mouseup", "click", "keydown"] as const;

export function bindIosAudioUnlockListeners(handler: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const options: AddEventListenerOptions = { passive: true, capture: true };
  for (const eventName of IOS_AUDIO_UNLOCK_EVENTS) {
    window.addEventListener(eventName, handler, options);
  }

  return () => {
    for (const eventName of IOS_AUDIO_UNLOCK_EVENTS) {
      window.removeEventListener(eventName, handler, options);
    }
  };
}

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

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

function kickSilentAudioBuffer(audioContext: AudioContext): void {
  try {
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch {
    // Ignore — resume() + HTMLAudio unlock may still succeed.
  }
}

/** Synchronously resume + kick Web Audio inside the current user gesture. */
function primeAudioContextFromGesture(): AudioContext | null {
  const audioContext = getSharedAudioContext();
  if (!audioContext) {
    return null;
  }

  if (audioContext.state !== "running") {
    void audioContext.resume();
  }

  kickSilentAudioBuffer(audioContext);
  return audioContext;
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

  const audio = gestureUnlockedAudio;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  return audio;
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
    kickSilentAudioBuffer(audioContext);
    return true;
  }

  try {
    await audioContext.resume();
  } catch {
    return false;
  }

  const running = getSharedAudioContext()?.state === "running";
  if (running) {
    kickSilentAudioBuffer(audioContext);
  }

  return running;
}

/**
 * Must be kicked from a user gesture (prefer click/touchend on iOS). Resumes
 * AudioContext, plays a silent buffer kick, then unlocks HTMLAudio.
 */
export function unlockVoicePlayback(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  // Always re-prime synchronously — iOS often suspends after navigation / sleep.
  const primedContext = primeAudioContextFromGesture();

  if (voicePlaybackUnlocked && primedContext?.state === "running") {
    return Promise.resolve(true);
  }

  if (unlockInFlight) {
    return unlockInFlight;
  }

  const resumePromise = resumeAppAudioContext();

  unlockInFlight = (async () => {
    try {
      const contextRunning = await resumePromise;
      const audioContext = getSharedAudioContext();

      let htmlUnlocked = false;
      try {
        const audio = getPlaybackAudioElement();
        // Only hijack the element when it is idle / still on the silent unlock clip.
        const canResetSrc =
          !audio.src ||
          audio.src === SILENT_WAV ||
          audio.src.startsWith("data:audio/wav");
        if (canResetSrc) {
          audio.muted = false;
          audio.volume = 0.001;
          audio.src = SILENT_WAV;
          audio.load();
          htmlUnlocked = await playAudioWithTimeout(audio, UNLOCK_PLAY_TIMEOUT_MS);
          if (htmlUnlocked && audio.src === SILENT_WAV) {
            audio.pause();
            audio.currentTime = 0;
          }
        } else {
          htmlUnlocked = voicePlaybackUnlocked;
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

function bindAudioContextVisibilityRecovery(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const audioContext = sharedAudioContext;
    if (audioContext && audioContext.state !== "running") {
      // Force a full unlock on the next gesture after sleep / backgrounding.
      voicePlaybackUnlocked = false;
    }
  });
}

bindAudioContextVisibilityRecovery();

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
