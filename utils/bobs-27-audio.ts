import {
  buildFinalTargetBullClipPath,
  buildPlayerEliminatedClipPath,
  buildRoundCompleteClipPath,
  buildScoreReducedClipPath,
  buildStartingScoreClipPath,
  getBobs27CalloutClipPath,
  getBobs27CalloutPhrase,
  getBobs27GameCompleteClipEntries,
  getBobs27TargetDoubleClipEntries,
  BOBS_27_CLIP_BASE_PATH,
  type Bobs27Callout,
} from "@/lib/bobs-27-callouts";
import {
  resolveBobs27AnnouncementsAfterVisit,
  resolveBobs27MatchStartAnnouncements,
  resolveBobs27TargetCalloutFromState,
} from "@/features/classic-games/lib/bobs-27-engine";
import type { Bobs27GameState } from "@/types/bobs-27";
import { speakFreePhrase } from "@/utils/free-speech";

let activeBobs27Audio: HTMLAudioElement | null = null;

function stopActiveBobs27Audio(): void {
  if (!activeBobs27Audio) {
    return;
  }

  activeBobs27Audio.pause();
  activeBobs27Audio.currentTime = 0;
  activeBobs27Audio = null;
}

export function primeBobs27Clips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getBobs27TargetDoubleClipEntries()) {
    const audio = new Audio(`${BOBS_27_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getBobs27GameCompleteClipEntries()) {
    const audio = new Audio(`${BOBS_27_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    buildStartingScoreClipPath(27),
    buildFinalTargetBullClipPath(),
    buildRoundCompleteClipPath(),
    buildScoreReducedClipPath(),
    buildPlayerEliminatedClipPath(),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playBobs27ClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveBobs27Audio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeBobs27Audio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeBobs27Audio === audio) {
          activeBobs27Audio = null;
        }

        if (failed) {
          reject(new Error("Bob's 27 clip playback failed"));
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

export async function announceBobs27Callout(callout: Bobs27Callout): Promise<void> {
  const clipPath = getBobs27CalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playBobs27ClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getBobs27CalloutPhrase(callout));
}

export async function announceBobs27Callouts(callouts: Bobs27Callout[]): Promise<void> {
  for (const callout of callouts) {
    await announceBobs27Callout(callout);
  }
}

export function announceBobs27MatchStart(state: Bobs27GameState): void {
  const callouts = resolveBobs27MatchStartAnnouncements(state);
  if (callouts.length === 0) {
    return;
  }

  void announceBobs27Callouts(callouts);
}

export function announceBobs27Target(state: Bobs27GameState): void {
  const callout = resolveBobs27TargetCalloutFromState(state);
  if (!callout) {
    return;
  }

  void announceBobs27Callout(callout);
}

export function announceBobs27AfterTurn(
  before: Bobs27GameState,
  after: Bobs27GameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveBobs27AnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceBobs27Callouts(callouts);
}
