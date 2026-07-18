import type { DartHit } from "@/types/dart";
import { readPersistedSoundEnabled } from "@/utils/sound-session-storage";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import {
  getAppAudioContext,
  isAppleTouchDevice,
  resumeAppAudioContext,
  unlockVoicePlayback,
} from "@/utils/voice-playback";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

const SFX_POOL_SIZE = 4;
const toneUriCache = new Map<string, string>();
let sfxAudioPool: HTMLAudioElement[] = [];
let sfxPoolIndex = 0;
let sfxHtmlUnlocked = false;

function encodeWavPcm16(samples: Float32Array, sampleRate: number): string {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function synthesizeToneDataUri(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
): string {
  const cacheKey = `${type}:${frequency}:${duration}:${volume}`;
  const cached = toneUriCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sampleRate = 22050;
  const numSamples = Math.max(1, Math.floor(sampleRate * duration));
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    const phase = t * frequency;
    const wave =
      type === "triangle"
        ? 2 * Math.abs(2 * (phase - Math.floor(phase + 0.5))) - 1
        : Math.sin(2 * Math.PI * phase);
    const attack = Math.min(1, t / 0.005);
    const releaseStart = duration * 0.35;
    const release =
      t < releaseStart
        ? 1
        : Math.max(0, 1 - (t - releaseStart) / Math.max(duration - releaseStart, 0.001));
    samples[i] = wave * volume * attack * release;
  }

  const uri = encodeWavPcm16(samples, sampleRate);
  toneUriCache.set(cacheKey, uri);
  return uri;
}

function ensureSfxAudioInDom(audio: HTMLAudioElement): void {
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

function getSfxAudioPool(): HTMLAudioElement[] {
  if (typeof window === "undefined") {
    return [];
  }

  if (sfxAudioPool.length === 0) {
    for (let i = 0; i < SFX_POOL_SIZE; i += 1) {
      const audio = new Audio();
      audio.setAttribute("playsinline", "true");
      audio.setAttribute("webkit-playsinline", "true");
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      ensureSfxAudioInDom(audio);
      sfxAudioPool.push(audio);
    }
  }

  return sfxAudioPool;
}

function getNextSfxAudio(): HTMLAudioElement | null {
  const pool = getSfxAudioPool();
  if (pool.length === 0) {
    return null;
  }

  const audio = pool[sfxPoolIndex] ?? null;
  sfxPoolIndex = (sfxPoolIndex + 1) % pool.length;
  return audio;
}

function unlockSfxHtmlAudioFromGesture(): void {
  const pool = getSfxAudioPool();
  if (pool.length === 0) {
    return;
  }

  for (const audio of pool) {
    ensureSfxAudioInDom(audio);
    // Skip elements mid-tone so unlock never cancels a dart hit in the same gesture.
    if (!audio.paused && audio.src && audio.src !== SILENT_WAV) {
      continue;
    }

    const previousMuted = audio.muted;
    audio.dataset.sfxUnlocking = "1";
    audio.muted = true;
    audio.src = SILENT_WAV;
    const playResult = audio.play();
    const finish = () => {
      // playHitTone clears this flag before starting a real tone.
      if (audio.dataset.sfxUnlocking !== "1") {
        return;
      }
      delete audio.dataset.sfxUnlocking;
      audio.pause();
      audio.currentTime = 0;
      audio.muted = previousMuted;
    };
    if (playResult && typeof playResult.then === "function") {
      void playResult.then(finish).catch(() => {
        if (audio.dataset.sfxUnlocking === "1") {
          delete audio.dataset.sfxUnlocking;
          audio.muted = previousMuted;
        }
      });
    } else {
      finish();
    }
  }

  sfxHtmlUnlocked = true;
}

function playHitToneViaHtmlAudio(
  frequency: number,
  options: { duration?: number; volume?: number; type?: OscillatorType } = {},
): boolean {
  const audio = getNextSfxAudio();
  if (!audio) {
    return false;
  }

  const duration = options.duration ?? 0.07;
  // HTMLAudio is often quieter than Web Audio oscillators — bump encoded level.
  const volume = Math.min(0.45, (options.volume ?? 0.1) * 2.8);
  const type = options.type ?? "sine";
  const uri = synthesizeToneDataUri(frequency, duration, volume, type);

  try {
    delete audio.dataset.sfxUnlocking;
    audio.pause();
    audio.muted = false;
    audio.volume = 1;
    audio.src = uri;
    audio.currentTime = 0;
    const playResult = audio.play();
    if (playResult && typeof playResult.then === "function") {
      void playResult
        .then(() => {
          sfxHtmlUnlocked = true;
        })
        .catch(() => {
          // Autoplay may still fail before unlock; Web Audio path can cover desktop.
        });
    }
    return true;
  } catch {
    return false;
  }
}

function playHitToneOnContext(
  context: AudioContext,
  frequency: number,
  options: { duration?: number; volume?: number; type?: OscillatorType } = {},
): void {
  try {
    const duration = options.duration ?? 0.07;
    const volume = options.volume ?? 0.1;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = options.type ?? "sine";
    oscillator.frequency.value = frequency;

    const start = context.currentTime;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  } catch {
    // Ignore audio init failures on restrictive browsers.
  }
}

function playHitTone(
  frequency: number,
  options: { duration?: number; volume?: number; type?: OscillatorType } = {},
): void {
  // iOS mute switch silences Web Audio but allows HTMLAudio — use HTML only there.
  if (isAppleTouchDevice()) {
    playHitToneViaHtmlAudio(frequency, options);
    return;
  }

  const context = getAppAudioContext();
  if (context) {
    if (context.state !== "running") {
      void context.resume();
    }
    playHitToneOnContext(context, frequency, options);
  }

  // Desktop fallback when Web Audio is blocked/suspended.
  if (!context || context.state !== "running") {
    playHitToneViaHtmlAudio(frequency, options);
  }
}

export function isSoundEffectsEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled || readPersistedSoundEnabled();
}

/** Kick Web Audio + HTMLAudio SFX unlock during a user gesture (match start / board tap). */
export function unlockSoundEffects(): void {
  void unlockVoicePlayback();
  void resumeAppAudioContext();
  unlockSfxHtmlAudioFromGesture();
}

export function playDartHitSound(hit: DartHit): void {
  if (!isSoundEffectsEnabled()) {
    return;
  }

  if (hit.segment === "bull") {
    playHitTone(300, { duration: 0.1, volume: 0.12 });
    return;
  }

  if (hit.multiplier === "miss" || hit.segment === "miss") {
    playHitTone(160, { duration: 0.09, volume: 0.07, type: "triangle" });
    return;
  }

  if (hit.multiplier === "triple") {
    playHitTone(720, { duration: 0.055, volume: 0.11 });
    return;
  }

  if (hit.multiplier === "double") {
    playHitTone(560, { duration: 0.06, volume: 0.1 });
    return;
  }

  playHitTone(420, { duration: 0.065, volume: 0.09 });
}

export function playSoundEffectsTest(): void {
  playDartHitSound({
    segment: 20,
    multiplier: "triple",
    score: 60,
    label: "T20",
  });
}
