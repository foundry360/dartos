import type { DartHit } from "@/types/dart";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { isSoundEffectsEnabled } from "@/utils/sound-effects";

type CelebrationKind = "double-bull" | "one-eighty" | "match-win";

const CROWD_CHEER_PATH = "/sounds/crowd-cheer.mp3";

const CELEBRATION_PLAYBACK: Record<
  CelebrationKind,
  { durationMs: number; volume: number }
> = {
  "double-bull": { durationMs: 3000, volume: 0.5 },
  "one-eighty": { durationMs: 3000, volume: 0.62 },
  "match-win": { durationMs: 4500, volume: 0.72 },
};

const FADE_OUT_MS = 600;

let crowdCheerAudio: HTMLAudioElement | null = null;
let crowdCheerUnlocked = false;
const activeCelebrationTimeouts = new WeakMap<HTMLAudioElement, number>();
const activeFadeFrames = new WeakMap<HTMLAudioElement, number>();
const celebrationPeakVolumes = new WeakMap<HTMLAudioElement, number>();

function getCrowdCheerAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!crowdCheerAudio) {
    crowdCheerAudio = new Audio(CROWD_CHEER_PATH);
    crowdCheerAudio.setAttribute("playsinline", "true");
    crowdCheerAudio.setAttribute("webkit-playsinline", "true");
    (crowdCheerAudio as HTMLAudioElement & { playsInline?: boolean }).playsInline =
      true;
    crowdCheerAudio.preload = "auto";
    crowdCheerAudio.load();
  }

  return crowdCheerAudio;
}

/**
 * Prime the cheer element inside a user gesture so later celebrations
 * are not blocked by iOS autoplay after navigation / backgrounding.
 */
export function unlockCelebrationSounds(): void {
  const audio = getCrowdCheerAudio();
  if (!audio || crowdCheerUnlocked) {
    return;
  }

  const previousMuted = audio.muted;
  audio.muted = true;
  const playResult = audio.play();

  const finishUnlock = () => {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = previousMuted;
    crowdCheerUnlocked = true;
  };

  if (playResult && typeof playResult.then === "function") {
    void playResult.then(finishUnlock).catch(() => {
      audio.muted = previousMuted;
    });
    return;
  }

  finishUnlock();
}

function clearCelebrationTimers(audio: HTMLAudioElement): void {
  const timeoutId = activeCelebrationTimeouts.get(audio);
  if (timeoutId != null) {
    window.clearTimeout(timeoutId);
    activeCelebrationTimeouts.delete(audio);
  }

  const fadeFrameId = activeFadeFrames.get(audio);
  if (fadeFrameId != null) {
    window.cancelAnimationFrame(fadeFrameId);
    activeFadeFrames.delete(audio);
  }
}

function stopCelebrationPlayback(audio: HTMLAudioElement): void {
  clearCelebrationTimers(audio);

  audio.pause();
  audio.currentTime = 0;

  const peakVolume = celebrationPeakVolumes.get(audio);
  if (peakVolume != null) {
    audio.volume = peakVolume;
  }
}

function fadeOutAndStop(audio: HTMLAudioElement, peakVolume: number, fadeMs: number): void {
  const fadeStart = performance.now();
  const startVolume = audio.volume;

  const step = (now: number) => {
    const progress = Math.min((now - fadeStart) / fadeMs, 1);
    audio.volume = startVolume * (1 - progress);

    if (progress < 1 && !audio.paused) {
      activeFadeFrames.set(audio, window.requestAnimationFrame(step));
      return;
    }

    activeFadeFrames.delete(audio);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = peakVolume;
  };

  activeFadeFrames.set(audio, window.requestAnimationFrame(step));
}

function scheduleCelebrationFadeOut(
  audio: HTMLAudioElement,
  durationMs: number,
  peakVolume: number,
): void {
  const fadeMs = Math.min(FADE_OUT_MS, Math.floor(durationMs * 0.3));
  const holdMs = Math.max(durationMs - fadeMs, 0);

  const timeoutId = window.setTimeout(() => {
    activeCelebrationTimeouts.delete(audio);
    fadeOutAndStop(audio, peakVolume, fadeMs);
  }, holdMs);

  activeCelebrationTimeouts.set(audio, timeoutId);
}

function playCelebration(kind: CelebrationKind): void {
  if (!isSoundEffectsEnabled()) {
    return;
  }

  const template = getCrowdCheerAudio();
  if (!template) {
    return;
  }

  // Prefer the unlocked element; only clone when it is already playing.
  const { durationMs, volume } = CELEBRATION_PLAYBACK[kind];
  const audio = template.paused
    ? template
    : (template.cloneNode(true) as HTMLAudioElement);

  stopCelebrationPlayback(audio);
  audio.muted = false;
  audio.volume = volume;
  audio.currentTime = 0;
  celebrationPeakVolumes.set(audio, volume);

  void audio.play().then(() => {
    crowdCheerUnlocked = true;
  }).catch(() => {
    // One retry after a silent unlock attempt (same-turn gesture when available).
    unlockCelebrationSounds();
    void audio.play().catch(() => {
      // Ignore autoplay or load failures on restrictive browsers.
    });
  });

  scheduleCelebrationFadeOut(audio, durationMs, volume);
}

export function isDoubleBullHit(hit: DartHit): boolean {
  return hit.segment === "bull" && hit.multiplier === "double";
}

export function isOneEightyVisit(visitScore: number, dartCount: number): boolean {
  return dartCount === DARTS_PER_VISIT && visitScore === 180;
}

export function playDoubleBullCelebration(): void {
  playCelebration("double-bull");
}

export function playOneEightyCelebration(): void {
  playCelebration("one-eighty");
}

export function playMatchWinCelebration(): void {
  playCelebration("match-win");
}

interface MatchCelebrationGame {
  status: "setup" | "playing" | "finished";
  visitDarts: DartHit[];
}

interface CelebrateOptions {
  skipMatchWinCelebration?: boolean;
}

export function celebrateAfterDartThrow<T extends MatchCelebrationGame>(
  hit: DartHit,
  game: T | null,
  getVisitScore: (activeGame: T) => number,
  options?: CelebrateOptions,
): void {
  if (!game) {
    return;
  }

  if (game.status === "finished") {
    if (!options?.skipMatchWinCelebration) {
      playMatchWinCelebration();
    }
    return;
  }

  if (isDoubleBullHit(hit)) {
    playDoubleBullCelebration();
  }

  if (
    game.visitDarts.length === DARTS_PER_VISIT &&
    getVisitScore(game) === 180
  ) {
    playOneEightyCelebration();
  }
}

export function celebrateAfterFinishTurn<T extends MatchCelebrationGame>(
  game: T | null,
  options?: CelebrateOptions,
): void {
  if (game?.status === "finished") {
    if (!options?.skipMatchWinCelebration) {
      playMatchWinCelebration();
    }
  }
}
