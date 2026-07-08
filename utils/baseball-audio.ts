import {
  getBaseballCalloutClipPath,
  getBaseballCalloutPhrase,
  getBaseballFixedClipPath,
  getBaseballInningClipEntries,
  BASEBALL_CLIP_BASE_PATH,
  type BaseballFixedCallout,
} from "@/lib/baseball-callouts";
import { getBaseballCurrentTarget } from "@/features/classic-games/lib/baseball-engine";
import type { BaseballGameState } from "@/types/baseball";
import { speakFreePhrase } from "@/utils/free-speech";

let activeBaseballAudio: HTMLAudioElement | null = null;

function stopActiveBaseballAudio(): void {
  if (!activeBaseballAudio) {
    return;
  }

  activeBaseballAudio.pause();
  activeBaseballAudio.currentTime = 0;
  activeBaseballAudio = null;
}

export function primeBaseballClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getBaseballInningClipEntries()) {
    const audio = new Audio(`${BASEBALL_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    getBaseballFixedClipPath({ type: "strikeout" }),
    getBaseballFixedClipPath({ type: "home-run" }),
    getBaseballFixedClipPath({ type: "end-of-inning" }),
    getBaseballFixedClipPath({ type: "final-score" }),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playBaseballClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveBaseballAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeBaseballAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeBaseballAudio === audio) {
          activeBaseballAudio = null;
        }

        if (failed) {
          reject(new Error("Baseball clip playback failed"));
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

export async function announceBaseballCallout(callout: BaseballFixedCallout): Promise<void> {
  const clipPath = getBaseballCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playBaseballClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getBaseballCalloutPhrase(callout));
}

export async function announceBaseballCallouts(callouts: BaseballFixedCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceBaseballCallout(callout);
  }
}

export function announceBaseballInning(
  inningNumber: number,
  targetLabel: string,
  targetSegment: number | "bull",
): void {
  void announceBaseballCallout({
    type: "inning",
    inningNumber,
    targetLabel,
    targetSegment,
  });
}

export function resolveBaseballAnnouncementsAfterTurn(
  before: BaseballGameState,
  after: BaseballGameState,
  completedPlayerIndex: number,
): BaseballFixedCallout[] {
  const announcements: BaseballFixedCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastVisitHomeRun) {
    announcements.push({ type: "home-run" });
  } else if (completedPlayer?.lastVisitRuns === 0) {
    announcements.push({ type: "strikeout" });
  }

  if (after.status === "finished") {
    announcements.push({ type: "end-of-inning" }, { type: "final-score" });
    return announcements;
  }

  const inningAdvanced =
    before.inningIndex !== after.inningIndex ||
    before.phase !== after.phase ||
    before.shootoutRound !== after.shootoutRound ||
    before.extraInningCount !== after.extraInningCount;

  if (inningAdvanced) {
    announcements.push({ type: "end-of-inning" });

    const target = getBaseballCurrentTarget(after);
    if (target) {
      announcements.push({
        type: "inning",
        inningNumber: target.inningNumber,
        targetLabel: target.displayLabel,
        targetSegment: target.segment,
      });
    }
  }

  return announcements;
}

export function announceBaseballAfterTurn(
  before: BaseballGameState,
  after: BaseballGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveBaseballAnnouncementsAfterTurn(before, after, completedPlayerIndex);
  if (callouts.length === 0) {
    return;
  }

  void announceBaseballCallouts(callouts);
}
