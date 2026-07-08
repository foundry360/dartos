export type ShanghaiCallout =
  | {
      type: "round";
      roundNumber: number;
      targetLabel: string;
      targetSegment: number | "bull";
    }
  | { type: "final-round-bull" }
  | { type: "round-complete" }
  | { type: "shanghai-achieved" }
  | { type: "player-wins"; playerNumber: number };

export const SHANGHAI_CLIP_BASE_PATH = "/sounds/shanghai";

export const SHANGHAI_MAX_ROUND_CLIP = 20;

export const SHANGHAI_MAX_PLAYER_CLIP = 4;

export function buildShanghaiRoundPhrase(roundNumber: number, targetLabel: string): string {
  return `Round ${roundNumber} — Target ${targetLabel}`;
}

export function buildShanghaiRoundSlug(roundNumber: number): string {
  return `round-${roundNumber}-target-${roundNumber}`;
}

export function buildShanghaiRoundClipPath(roundNumber: number): string {
  return `${SHANGHAI_CLIP_BASE_PATH}/${buildShanghaiRoundSlug(roundNumber)}.wav`;
}

export function canUseShanghaiRoundClip(
  roundNumber: number,
  targetSegment: number | "bull",
): boolean {
  return (
    targetSegment !== "bull" &&
    roundNumber === targetSegment &&
    roundNumber >= 1 &&
    roundNumber <= SHANGHAI_MAX_ROUND_CLIP
  );
}

export function buildFinalRoundBullPhrase(): string {
  return "Final round — Bull";
}

export function buildFinalRoundBullClipPath(): string {
  return `${SHANGHAI_CLIP_BASE_PATH}/final-round-bull.wav`;
}

export function buildRoundCompletePhrase(): string {
  return "Round complete";
}

export function buildRoundCompleteClipPath(): string {
  return `${SHANGHAI_CLIP_BASE_PATH}/round-complete.wav`;
}

export function buildShanghaiAchievedPhrase(): string {
  return "Shanghai achieved!";
}

export function buildShanghaiAchievedClipPath(): string {
  return `${SHANGHAI_CLIP_BASE_PATH}/shanghai-achieved.wav`;
}

export function buildPlayerWinsPhrase(playerNumber: number): string {
  return `Player ${playerNumber} wins!`;
}

export function buildPlayerWinsSlug(playerNumber: number): string {
  return `player-${playerNumber}-wins`;
}

export function buildPlayerWinsClipPath(playerNumber: number): string {
  return `${SHANGHAI_CLIP_BASE_PATH}/${buildPlayerWinsSlug(playerNumber)}.wav`;
}

export function canUsePlayerWinsClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= SHANGHAI_MAX_PLAYER_CLIP;
}

export function getShanghaiRoundClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: SHANGHAI_MAX_ROUND_CLIP }, (_, index) => {
    const roundNumber = index + 1;
    return {
      slug: buildShanghaiRoundSlug(roundNumber),
      phrase: buildShanghaiRoundPhrase(roundNumber, String(roundNumber)),
    };
  });
}

export function getShanghaiPlayerWinsClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: SHANGHAI_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildPlayerWinsSlug(playerNumber),
      phrase: buildPlayerWinsPhrase(playerNumber),
    };
  });
}

export function getShanghaiCalloutPhrase(callout: ShanghaiCallout): string {
  switch (callout.type) {
    case "round":
      return buildShanghaiRoundPhrase(callout.roundNumber, callout.targetLabel);
    case "final-round-bull":
      return buildFinalRoundBullPhrase();
    case "round-complete":
      return buildRoundCompletePhrase();
    case "shanghai-achieved":
      return buildShanghaiAchievedPhrase();
    case "player-wins":
      return buildPlayerWinsPhrase(callout.playerNumber);
  }
}

export function getShanghaiCalloutClipPath(callout: ShanghaiCallout): string | null {
  switch (callout.type) {
    case "round":
      if (!canUseShanghaiRoundClip(callout.roundNumber, callout.targetSegment)) {
        return null;
      }

      return buildShanghaiRoundClipPath(callout.roundNumber);
    case "final-round-bull":
      return buildFinalRoundBullClipPath();
    case "round-complete":
      return buildRoundCompleteClipPath();
    case "shanghai-achieved":
      return buildShanghaiAchievedClipPath();
    case "player-wins":
      if (!canUsePlayerWinsClip(callout.playerNumber)) {
        return null;
      }

      return buildPlayerWinsClipPath(callout.playerNumber);
  }
}
