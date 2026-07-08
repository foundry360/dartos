import { buildVisitTotalCallout } from "@/utils/score-callout";

const SCORE_CLIP_BASE_PATH = "/sounds/scores";

let activeScoreAudio: HTMLAudioElement | null = null;

function stopActiveScoreAudio(): void {
  if (!activeScoreAudio) {
    return;
  }

  activeScoreAudio.pause();
  activeScoreAudio.currentTime = 0;
  activeScoreAudio = null;
}

function getVisitTotalClipPath(total: number, busted: boolean): string {
  const label = buildVisitTotalCallout(total, busted).toLowerCase().replace(/\s+/g, "-");
  return `${SCORE_CLIP_BASE_PATH}/${label}.wav`;
}

export async function playVisitTotalClip(total: number, busted = false): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveScoreAudio();

  const src = getVisitTotalClipPath(total, busted);
  const audio = new Audio(src);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeScoreAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeScoreAudio === audio) {
          activeScoreAudio = null;
        }

        if (failed) {
          reject(new Error("Score clip playback failed"));
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

export function primeScoreClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  const warmClip = new Audio(`${SCORE_CLIP_BASE_PATH}/140.wav`);
  warmClip.preload = "auto";
  warmClip.load();
}
