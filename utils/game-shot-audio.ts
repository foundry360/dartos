import {
  buildGameShotClipPath,
  buildGameShotPhrase,
  getGameShotClipEntries,
  type GameShotOutcome,
} from "@/lib/game-shot-callouts";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";

export function primeGameShotClips(): void {
  prefetchCommentaryEntries("game-shot", getGameShotClipEntries());
}

export async function playGameShotClip(outcome: GameShotOutcome): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  await announceLegacyClipPath(buildGameShotClipPath(outcome), buildGameShotPhrase(outcome));
  return true;
}

export async function announceGameShot(outcome: GameShotOutcome): Promise<void> {
  await announceLegacyClipPath(buildGameShotClipPath(outcome), buildGameShotPhrase(outcome));
}

export function warmGameShotCache(): void {
  primeCommentaryCache();
  prefetchLegacyClipPath(
    buildGameShotClipPath("leg"),
    buildGameShotPhrase("leg"),
  );
}
