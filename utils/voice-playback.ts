import { cancelFreeSpeech } from "@/utils/free-speech";

let activeAudio: HTMLAudioElement | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let playbackQueue: Promise<void> = Promise.resolve();
let voicePlaybackGeneration = 0;
let voicePlaybackUnlocked = false;
let sharedAudioContext: AudioContext | null = null;
/** Reused after a successful gesture unlock — required for iOS/PWA programmatic playback. */
let gestureUnlockedAudio: HTMLAudioElement | null = null;
let globalUnlockBound = false;

/**
 * Silent WAV used for the gesture unlock. Must be playable the instant src is set
 * so Safari credits the user gesture without waiting on network/load.
 */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/**
 * iOS WebKit needs a real touch/mouse/key gesture for media unlock.
 * Capture so unlock still runs when a child stops propagation.
 */
export const IOS_AUDIO_UNLOCK_EVENTS = [
  "touchstart",
  "touchend",
  "mousedown",
  "mouseup",
  "click",
  "keydown",
] as const;

const RESUME_TIMEOUT_MS = 400;

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

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return true;
  }

  // iPadOS reports as MacIntel with touch.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function getAudioContextConstructor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

function getSharedAudioContext(): AudioContext | null {
  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) {
    return null;
  }

  const contextState = sharedAudioContext?.state as string | undefined;
  if (sharedAudioContext && contextState === "closed") {
    sharedAudioContext = null;
    voicePlaybackUnlocked = false;
  }

  // iOS can mark the context "interrupted" after calls / Control Center.
  // Resume in place — recreating leaves a fresh suspended context that drops SFX.
  if (sharedAudioContext && contextState === "interrupted") {
    void sharedAudioContext.resume();
    kickSilentAudioBuffer(sharedAudioContext);
    return sharedAudioContext;
  }

  if (!sharedAudioContext) {
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
    // Ignore.
  }
}

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
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

function ensureAudioElementInDom(audio: HTMLAudioElement): void {
  if (typeof document === "undefined" || audio.isConnected) {
    return;
  }

  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  audio.setAttribute("x-webkit-airplay", "deny");
  audio.preload = "auto";
  audio.style.display = "none";
  document.body.appendChild(audio);
}

function getPlaybackAudioElement(): HTMLAudioElement {
  if (!gestureUnlockedAudio) {
    gestureUnlockedAudio = new Audio();
  }

  const audio = gestureUnlockedAudio;
  audio.setAttribute("playsinline", "true");
  audio.setAttribute("webkit-playsinline", "true");
  (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  ensureAudioElementInDom(audio);
  return audio;
}

/**
 * CRITICAL for iOS: call play() synchronously inside the gesture handler.
 * Any await before play() loses the gesture and Safari never unlocks the element.
 */
function unlockHtmlAudioFromGesture(): boolean {
  const audio = getPlaybackAudioElement();
  const src = audio.src || "";
  const isDataSrc = !src || src.startsWith("data:");
  const playingRealClip = Boolean(src) && !isDataSrc && !audio.paused && !audio.ended;

  // Never interrupt an in-progress announcement with the silent unlock clip.
  if (playingRealClip) {
    voicePlaybackUnlocked = true;
    return true;
  }

  try {
    audio.muted = true;
    audio.volume = 1;
    if (isDataSrc || audio.paused || audio.ended) {
      audio.src = SILENT_WAV;
    }
    // Sync play() — this is what unlocks iOS for later programmatic plays.
    void audio.play().then(() => {
      if ((audio.src || "").startsWith("data:")) {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // Ignore.
        }
        audio.muted = false;
      }
    }).catch(() => {
      // Next gesture will retry.
    });
    voicePlaybackUnlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function isVoicePlaybackUnlocked(): boolean {
  return voicePlaybackUnlocked;
}

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
    await raceWithTimeout(audioContext.resume(), RESUME_TIMEOUT_MS, undefined);
  } catch {
    // Ignore — fall through to state check.
  }

  const running = (audioContext.state as string) === "running";
  if (running) {
    kickSilentAudioBuffer(audioContext);
  }

  return running;
}

/**
 * Must be kicked from a user gesture. Unlocks a persistent HTMLAudioElement
 * (works with the iOS mute switch) and primes Web Audio for SFX.
 */
export function unlockVoicePlayback(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  // HTML unlock first — Web Audio alone stays silent when the ringer is muted.
  const htmlOk = unlockHtmlAudioFromGesture();
  const primedContext = primeAudioContextFromGesture();

  if (htmlOk || primedContext?.state === "running") {
    voicePlaybackUnlocked = true;
    return Promise.resolve(true);
  }

  return Promise.resolve(voicePlaybackUnlocked);
}

/** Install once so any tap anywhere can unlock audio before match screens mount. */
export function installGlobalAudioUnlock(): void {
  if (typeof window === "undefined" || globalUnlockBound) {
    return;
  }

  globalUnlockBound = true;
  bindIosAudioUnlockListeners(() => {
    void unlockVoicePlayback();
  });
}

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    installGlobalAudioUnlock();
  });
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
  try {
    activeAudio.currentTime = 0;
  } catch {
    // Ignore.
  }

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

  // Reuse the gesture-unlocked element — new Audio() would require another tap on iOS.
  stopBufferSource();
  if (activeAudio && activeAudio !== audio) {
    activeAudio.pause();
  }

  audio.muted = false;
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  try {
    audio.preservesPitch = true;
  } catch {
    // Older WebKit.
  }
  audio.src = objectUrl;
  activeAudio = audio;

  try {
    // Do NOT call load()/waitForCanPlay — that can drop the iOS unlock credit.
    await audio.play();
    voicePlaybackUnlocked = true;

    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        audio.onended = null;
        audio.onerror = null;

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

      if (audio.ended) {
        cleanup(false);
      }
    });

    return true;
  } catch {
    if (activeAudio === audio) {
      activeAudio = null;
    }

    return false;
  } finally {
    // Delay revoke so Safari finishes decoding/playing the blob URL.
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 2_000);
  }
}

export async function playVoiceBlob(blob: Blob, playbackRate = 1, volume = 0.95): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const generationAtStart = getVoicePlaybackGeneration();

  // Best-effort — never block playback if the silent unlock flag is still clear.
  void unlockVoicePlayback();
  void resumeAppAudioContext();

  if (isVoicePlaybackCancelled(generationAtStart)) {
    return false;
  }

  const audioContext = getSharedAudioContext();
  stopVoicePlayback();

  if (isVoicePlaybackCancelled(generationAtStart)) {
    return false;
  }

  // iOS mute switch silences Web Audio but allows HTMLAudio — prefer HTML there.
  if (isAppleTouchDevice()) {
    if (await playVoiceBlobViaHtmlAudio(blob, playbackRate, volume)) {
      return true;
    }

    if (audioContext && (audioContext.state as string) === "running") {
      try {
        return await playVoiceBlobViaAudioContext(blob, audioContext, playbackRate, volume);
      } catch {
        return false;
      }
    }

    return false;
  }

  if (audioContext && (audioContext.state as string) === "running") {
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
