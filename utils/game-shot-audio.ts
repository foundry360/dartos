import {
  buildGameShotClipPath,
  buildGameShotPhrase,
  type GameShotOutcome,
  GAME_SHOT_CLIP_BASE_PATH,
} from "@/lib/game-shot-callouts";
import { speakFreePhrase } from "@/utils/free-speech";

let activeGameShotAudio: HTMLAudioElement | null = null;

function stopActiveGameShotAudio(): void {
  if (!activeGameShotAudio) {
    return;
  }

  activeGameShotAudio.pause();
  activeGameShotAudio.currentTime = 0;
  activeGameShotAudio = null;
}

export function primeGameShotClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const outcome of ["leg", "first-leg", "match"] as const) {
    const audio = new Audio(buildGameShotClipPath(outcome));
    audio.preload = "auto";
    audio.load();
  }
}

export async function playGameShotClip(outcome: GameShotOutcome): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveGameShotAudio();

  const audio = new Audio(buildGameShotClipPath(outcome));
  audio.volume = 0.95;
  audio.preload = "auto";
  activeGameShotAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeGameShotAudio === audio) {
          activeGameShotAudio = null;
        }

        if (failed) {
          reject(new Error("Game shot clip playback failed"));
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
    return false;
  }
}

export async function announceGameShot(outcome: GameShotOutcome): Promise<void> {
  const playedClip = await playGameShotClip(outcome);
  if (playedClip) {
    return;
  }

  await speakFreePhrase(buildGameShotPhrase(outcome));
}

export function warmGameShotCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  const warmClip = new Audio(`${GAME_SHOT_CLIP_BASE_PATH}/game-shot.wav`);
  warmClip.preload = "auto";
  warmClip.load();
}
