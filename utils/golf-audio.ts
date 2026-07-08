import {
  getGolfCalloutClipPath,
  getGolfCalloutPhrase,
  getGolfFixedClipPath,
  getGolfHoleClipEntries,
  GOLF_CLIP_BASE_PATH,
  type GolfFixedCallout,
} from "@/lib/golf-callouts";
import { getGolfCurrentHole } from "@/features/classic-games/lib/golf-engine";
import type { GolfGameState } from "@/types/golf";
import { speakFreePhrase } from "@/utils/free-speech";

let activeGolfAudio: HTMLAudioElement | null = null;

function stopActiveGolfAudio(): void {
  if (!activeGolfAudio) {
    return;
  }

  activeGolfAudio.pause();
  activeGolfAudio.currentTime = 0;
  activeGolfAudio = null;
}

export function primeGolfClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getGolfHoleClipEntries()) {
    const audio = new Audio(`${GOLF_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    getGolfFixedClipPath({ type: "birdie" }),
    getGolfFixedClipPath({ type: "eagle" }),
    getGolfFixedClipPath({ type: "hole-complete" }),
    getGolfFixedClipPath({ type: "final-score" }),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playGolfClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveGolfAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeGolfAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeGolfAudio === audio) {
          activeGolfAudio = null;
        }

        if (failed) {
          reject(new Error("Golf clip playback failed"));
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

export async function announceGolfCallout(callout: GolfFixedCallout): Promise<void> {
  const clipPath = getGolfCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playGolfClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getGolfCalloutPhrase(callout));
}

export async function announceGolfCallouts(callouts: GolfFixedCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceGolfCallout(callout);
  }
}

export function announceGolfHole(
  holeNumber: number,
  targetLabel: string,
  targetSegment: number | "bull",
): void {
  void announceGolfCallout({
    type: "hole",
    holeNumber,
    targetLabel,
    targetSegment,
  });
}

export function resolveGolfAnnouncementsAfterTurn(
  before: GolfGameState,
  after: GolfGameState,
  completedPlayerIndex: number,
): GolfFixedCallout[] {
  const announcements: GolfFixedCallout[] = [];
  const completedPlayer = after.players[completedPlayerIndex];

  if (completedPlayer?.lastHoleResultLabel === "Birdie") {
    announcements.push({ type: "birdie" });
  } else if (completedPlayer?.lastHoleResultLabel === "Eagle") {
    announcements.push({ type: "eagle" });
  }

  if (after.status === "finished") {
    announcements.push({ type: "hole-complete" }, { type: "final-score" });
    return announcements;
  }

  const holeAdvanced =
    before.holeIndex !== after.holeIndex ||
    before.phase !== after.phase ||
    before.tiebreakRound !== after.tiebreakRound ||
    before.suddenDeathRound !== after.suddenDeathRound;

  if (holeAdvanced) {
    announcements.push({ type: "hole-complete" });

    const hole = getGolfCurrentHole(after);
    if (hole) {
      announcements.push({
        type: "hole",
        holeNumber: hole.holeNumber,
        targetLabel: hole.displayLabel,
        targetSegment: hole.segment,
      });
    }
  }

  return announcements;
}

export function announceGolfAfterTurn(
  before: GolfGameState,
  after: GolfGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveGolfAnnouncementsAfterTurn(before, after, completedPlayerIndex);
  if (callouts.length === 0) {
    return;
  }

  void announceGolfCallouts(callouts);
}
