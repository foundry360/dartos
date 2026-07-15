import type { DartHit } from "@/types/dart";
import { readPersistedSoundEnabled } from "@/utils/sound-session-storage";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { getAppAudioContext, unlockVoicePlayback } from "@/utils/voice-playback";

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
  const context = getAppAudioContext();
  if (!context) {
    return;
  }

  // Must start the oscillator in the same user-gesture turn as resume() — awaiting
  // resume on iOS/PWA loses the gesture and the hit stays silent.
  if (context.state !== "running") {
    void context.resume();
  }

  playHitToneOnContext(context, frequency, options);
}

export function isSoundEffectsEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled || readPersistedSoundEnabled();
}

/** Kick Web Audio resume during a user gesture (match start / board tap). */
export function unlockSoundEffects(): void {
  void unlockVoicePlayback();
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
