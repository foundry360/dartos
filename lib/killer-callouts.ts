import { formatKillerAssignedNumber } from "@/features/classic-games/lib/killer-config";
import type { KillerAssignedNumber } from "@/types/killer";

export type KillerCallout =
  | { type: "player-numbers-assigned" }
  | { type: "player-target"; playerNumber: number; target: KillerAssignedNumber }
  | { type: "is-killer"; playerNumber: number }
  | { type: "double-hit" }
  | { type: "player-eliminated" }
  | { type: "player-wins"; playerNumber: number };

export const KILLER_CLIP_BASE_PATH = "/sounds/killer";

export const KILLER_MAX_PLAYER_CLIP = 4;

export const KILLER_MAX_TARGET_CLIP = 20;

export function buildPlayerNumbersAssignedPhrase(): string {
  return "Player numbers assigned";
}

export function buildPlayerNumbersAssignedClipPath(): string {
  return `${KILLER_CLIP_BASE_PATH}/player-numbers-assigned.wav`;
}

export function buildPlayerTargetPhrase(
  playerNumber: number,
  target: KillerAssignedNumber,
): string {
  return `Player ${playerNumber} target: ${formatKillerAssignedNumber(target)}`;
}

export function buildPlayerTargetSlug(
  playerNumber: number,
  target: KillerAssignedNumber,
): string {
  const targetSlug = target === "bull" ? "bull" : String(target);
  return `player-${playerNumber}-target-${targetSlug}`;
}

export function buildPlayerTargetClipPath(
  playerNumber: number,
  target: KillerAssignedNumber,
): string {
  return `${KILLER_CLIP_BASE_PATH}/${buildPlayerTargetSlug(playerNumber, target)}.wav`;
}

export function canUsePlayerTargetClip(
  playerNumber: number,
  target: KillerAssignedNumber,
): boolean {
  if (playerNumber < 1 || playerNumber > KILLER_MAX_PLAYER_CLIP) {
    return false;
  }

  if (target === "bull") {
    return true;
  }

  return target >= 1 && target <= KILLER_MAX_TARGET_CLIP;
}

export function buildIsKillerPhrase(playerNumber: number): string {
  return `Player ${playerNumber} is now a Killer`;
}

export function buildIsKillerSlug(playerNumber: number): string {
  return `player-${playerNumber}-is-killer`;
}

export function buildIsKillerClipPath(playerNumber: number): string {
  return `${KILLER_CLIP_BASE_PATH}/${buildIsKillerSlug(playerNumber)}.wav`;
}

export function canUseIsKillerClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= KILLER_MAX_PLAYER_CLIP;
}

export function buildDoubleHitPhrase(): string {
  return "Double hit — two lives removed";
}

export function buildDoubleHitClipPath(): string {
  return `${KILLER_CLIP_BASE_PATH}/double-hit-two-lives-removed.wav`;
}

export function buildPlayerEliminatedPhrase(): string {
  return "Player eliminated";
}

export function buildPlayerEliminatedClipPath(): string {
  return `${KILLER_CLIP_BASE_PATH}/player-eliminated.wav`;
}

export function buildPlayerWinsPhrase(playerNumber: number): string {
  return `Player ${playerNumber} wins`;
}

export function buildPlayerWinsSlug(playerNumber: number): string {
  return `player-${playerNumber}-wins`;
}

export function buildPlayerWinsClipPath(playerNumber: number): string {
  return `${KILLER_CLIP_BASE_PATH}/${buildPlayerWinsSlug(playerNumber)}.wav`;
}

export function canUsePlayerWinsClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= KILLER_MAX_PLAYER_CLIP;
}

export function getKillerPlayerTargetClipEntries(): Array<{ slug: string; phrase: string }> {
  const entries: Array<{ slug: string; phrase: string }> = [];

  for (let playerNumber = 1; playerNumber <= KILLER_MAX_PLAYER_CLIP; playerNumber += 1) {
    for (let target = 1; target <= KILLER_MAX_TARGET_CLIP; target += 1) {
      entries.push({
        slug: buildPlayerTargetSlug(playerNumber, target),
        phrase: buildPlayerTargetPhrase(playerNumber, target),
      });
    }

    entries.push({
      slug: buildPlayerTargetSlug(playerNumber, "bull"),
      phrase: buildPlayerTargetPhrase(playerNumber, "bull"),
    });
  }

  return entries;
}

export function getKillerIsKillerClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: KILLER_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildIsKillerSlug(playerNumber),
      phrase: buildIsKillerPhrase(playerNumber),
    };
  });
}

export function getKillerPlayerWinsClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: KILLER_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildPlayerWinsSlug(playerNumber),
      phrase: buildPlayerWinsPhrase(playerNumber),
    };
  });
}

export function getKillerCalloutPhrase(callout: KillerCallout): string {
  switch (callout.type) {
    case "player-numbers-assigned":
      return buildPlayerNumbersAssignedPhrase();
    case "player-target":
      return buildPlayerTargetPhrase(callout.playerNumber, callout.target);
    case "is-killer":
      return buildIsKillerPhrase(callout.playerNumber);
    case "double-hit":
      return buildDoubleHitPhrase();
    case "player-eliminated":
      return buildPlayerEliminatedPhrase();
    case "player-wins":
      return buildPlayerWinsPhrase(callout.playerNumber);
  }
}

export function getKillerCalloutClipPath(callout: KillerCallout): string | null {
  switch (callout.type) {
    case "player-numbers-assigned":
      return buildPlayerNumbersAssignedClipPath();
    case "player-target":
      if (!canUsePlayerTargetClip(callout.playerNumber, callout.target)) {
        return null;
      }

      return buildPlayerTargetClipPath(callout.playerNumber, callout.target);
    case "is-killer":
      if (!canUseIsKillerClip(callout.playerNumber)) {
        return null;
      }

      return buildIsKillerClipPath(callout.playerNumber);
    case "double-hit":
      return buildDoubleHitClipPath();
    case "player-eliminated":
      return buildPlayerEliminatedClipPath();
    case "player-wins":
      if (!canUsePlayerWinsClip(callout.playerNumber)) {
        return null;
      }

      return buildPlayerWinsClipPath(callout.playerNumber);
  }
}
