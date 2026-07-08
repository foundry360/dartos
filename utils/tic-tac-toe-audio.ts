import {
  buildAlreadyClaimedClipPath,
  buildGameCompleteClipPath,
  buildGameTitleClipPath,
  buildNoClaimClipPath,
  buildSquareClaimedClipPath,
  buildTargetsDisplayedClipPath,
  buildThreeInARowClipPath,
  getTicTacToeCalloutClipPath,
  getTicTacToeCalloutPhrase,
  getTicTacToePlayerStartsClipEntries,
  getTicTacToePlayerWinsClipEntries,
  TIC_TAC_TOE_CLIP_BASE_PATH,
  type TicTacToeCallout,
} from "@/lib/tic-tac-toe-callouts";
import {
  resolveTicTacToeAnnouncementsAfterVisit,
  resolveTicTacToeMatchStartAnnouncements,
} from "@/features/classic-games/lib/tic-tac-toe-engine";
import type { TicTacToeGameState } from "@/types/tic-tac-toe";
import { speakFreePhrase } from "@/utils/free-speech";

let activeTicTacToeAudio: HTMLAudioElement | null = null;

function stopActiveTicTacToeAudio(): void {
  if (!activeTicTacToeAudio) {
    return;
  }

  activeTicTacToeAudio.pause();
  activeTicTacToeAudio.currentTime = 0;
  activeTicTacToeAudio = null;
}

export function primeTicTacToeClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getTicTacToePlayerStartsClipEntries()) {
    const audio = new Audio(`${TIC_TAC_TOE_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getTicTacToePlayerWinsClipEntries()) {
    const audio = new Audio(`${TIC_TAC_TOE_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    buildGameTitleClipPath(),
    buildTargetsDisplayedClipPath(),
    buildSquareClaimedClipPath(),
    buildAlreadyClaimedClipPath(),
    buildNoClaimClipPath(),
    buildThreeInARowClipPath(),
    buildGameCompleteClipPath(),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playTicTacToeClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveTicTacToeAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeTicTacToeAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeTicTacToeAudio === audio) {
          activeTicTacToeAudio = null;
        }

        if (failed) {
          reject(new Error("Tic Tac Toe clip playback failed"));
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

export async function announceTicTacToeCallout(callout: TicTacToeCallout): Promise<void> {
  const clipPath = getTicTacToeCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playTicTacToeClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getTicTacToeCalloutPhrase(callout));
}

export async function announceTicTacToeCallouts(callouts: TicTacToeCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceTicTacToeCallout(callout);
  }
}

export function announceTicTacToeMatchStart(state: TicTacToeGameState): void {
  void announceTicTacToeCallouts(resolveTicTacToeMatchStartAnnouncements(state));
}

export function announceTicTacToeAfterVisit(
  before: TicTacToeGameState,
  after: TicTacToeGameState,
  completedPlayerIndex: number,
): void {
  const callouts = resolveTicTacToeAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceTicTacToeCallouts(callouts);
}
