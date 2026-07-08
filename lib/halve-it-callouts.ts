export type HalveItCallout =
  | {
      type: "round";
      roundNumber: number;
      targetLabel: string;
      targetSegment: number | "bull";
    }
  | { type: "final-round-bull" }
  | { type: "round-complete" }
  | { type: "score-halved" }
  | { type: "game-complete"; playerNumber: number };

export const HALVE_IT_CLIP_BASE_PATH = "/sounds/halve-it";

export const HALVE_IT_MAX_ROUND_CLIP = 20;

export const HALVE_IT_MAX_PLAYER_CLIP = 4;

export function buildHalveItRoundPhrase(roundNumber: number, targetLabel: string): string {
  return `Round ${roundNumber} — Target ${targetLabel}`;
}

export function buildHalveItRoundSlug(
  roundNumber: number,
  targetSegment: number | "bull",
): string {
  const targetPart = targetSegment === "bull" ? "bull" : String(targetSegment);
  return `round-${roundNumber}-target-${targetPart}`;
}

export function buildHalveItRoundClipPath(
  roundNumber: number,
  targetSegment: number | "bull",
): string {
  return `${HALVE_IT_CLIP_BASE_PATH}/${buildHalveItRoundSlug(roundNumber, targetSegment)}.wav`;
}

export function canUseHalveItRoundClip(
  roundNumber: number,
  targetSegment: number | "bull",
): boolean {
  if (targetSegment === "bull") {
    return false;
  }

  if (
    roundNumber >= 1 &&
    roundNumber <= HALVE_IT_MAX_ROUND_CLIP &&
    roundNumber === targetSegment
  ) {
    return true;
  }

  return roundNumber >= 1 && roundNumber <= 9 && targetSegment === roundNumber + 11;
}

export function buildFinalRoundBullPhrase(): string {
  return "Final round — Bull";
}

export function buildFinalRoundBullClipPath(): string {
  return `${HALVE_IT_CLIP_BASE_PATH}/final-round-bull.wav`;
}

export function buildRoundCompletePhrase(): string {
  return "Round complete";
}

export function buildRoundCompleteClipPath(): string {
  return `${HALVE_IT_CLIP_BASE_PATH}/round-complete.wav`;
}

export function buildScoreHalvedPhrase(): string {
  return "No score — score halved";
}

export function buildScoreHalvedClipPath(): string {
  return `${HALVE_IT_CLIP_BASE_PATH}/no-score-score-halved.wav`;
}

export function buildGameCompletePhrase(playerNumber: number): string {
  return `Game complete — Player ${playerNumber} wins`;
}

export function buildGameCompleteSlug(playerNumber: number): string {
  return `game-complete-player-${playerNumber}`;
}

export function buildGameCompleteClipPath(playerNumber: number): string {
  return `${HALVE_IT_CLIP_BASE_PATH}/${buildGameCompleteSlug(playerNumber)}.wav`;
}

export function canUseGameCompleteClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= HALVE_IT_MAX_PLAYER_CLIP;
}

export function getHalveItRoundClipEntries(): Array<{ slug: string; phrase: string }> {
  const entries = new Map<string, { slug: string; phrase: string }>();

  const add = (roundNumber: number, targetLabel: string, targetSegment: number) => {
    const slug = buildHalveItRoundSlug(roundNumber, targetSegment);
    entries.set(slug, {
      slug,
      phrase: buildHalveItRoundPhrase(roundNumber, targetLabel),
    });
  };

  for (let roundNumber = 1; roundNumber <= HALVE_IT_MAX_ROUND_CLIP; roundNumber += 1) {
    add(roundNumber, String(roundNumber), roundNumber);
  }

  for (let roundNumber = 1; roundNumber <= 9; roundNumber += 1) {
    const target = roundNumber + 11;
    add(roundNumber, String(target), target);
  }

  return [...entries.values()];
}

export function getHalveItGameCompleteClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: HALVE_IT_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildGameCompleteSlug(playerNumber),
      phrase: buildGameCompletePhrase(playerNumber),
    };
  });
}

export function getHalveItCalloutPhrase(callout: HalveItCallout): string {
  switch (callout.type) {
    case "round":
      return buildHalveItRoundPhrase(callout.roundNumber, callout.targetLabel);
    case "final-round-bull":
      return buildFinalRoundBullPhrase();
    case "round-complete":
      return buildRoundCompletePhrase();
    case "score-halved":
      return buildScoreHalvedPhrase();
    case "game-complete":
      return buildGameCompletePhrase(callout.playerNumber);
  }
}

export function getHalveItCalloutClipPath(callout: HalveItCallout): string | null {
  switch (callout.type) {
    case "round":
      if (!canUseHalveItRoundClip(callout.roundNumber, callout.targetSegment)) {
        return null;
      }

      return buildHalveItRoundClipPath(callout.roundNumber, callout.targetSegment);
    case "final-round-bull":
      return buildFinalRoundBullClipPath();
    case "round-complete":
      return buildRoundCompleteClipPath();
    case "score-halved":
      return buildScoreHalvedClipPath();
    case "game-complete":
      if (!canUseGameCompleteClip(callout.playerNumber)) {
        return null;
      }

      return buildGameCompleteClipPath(callout.playerNumber);
  }
}
