export type Bobs27Callout =
  | { type: "starting-score"; score: number }
  | { type: "target-double"; segment: number }
  | { type: "target"; displayLabel: string }
  | { type: "final-target-bull" }
  | { type: "round-complete" }
  | { type: "score-reduced" }
  | { type: "player-eliminated" }
  | { type: "game-complete"; playerNumber: number };

export const BOBS_27_CLIP_BASE_PATH = "/sounds/bobs-27";

export const BOBS_27_DEFAULT_STARTING_SCORE_CLIP = 27;

export const BOBS_27_MAX_DOUBLE_TARGET_CLIP = 20;

export const BOBS_27_MAX_PLAYER_CLIP = 8;

export function buildStartingScorePhrase(score: number): string {
  return `Starting score: ${score}`;
}

export function buildStartingScoreSlug(score: number): string {
  return `starting-score-${score}`;
}

export function buildStartingScoreClipPath(score: number): string {
  return `${BOBS_27_CLIP_BASE_PATH}/${buildStartingScoreSlug(score)}.wav`;
}

export function canUseStartingScoreClip(score: number): boolean {
  return score === BOBS_27_DEFAULT_STARTING_SCORE_CLIP;
}

export function buildTargetDoublePhrase(segment: number): string {
  return `Target: Double ${segment}`;
}

export function buildTargetDoubleSlug(segment: number): string {
  return `target-double-${segment}`;
}

export function buildTargetDoubleClipPath(segment: number): string {
  return `${BOBS_27_CLIP_BASE_PATH}/${buildTargetDoubleSlug(segment)}.wav`;
}

export function canUseTargetDoubleClip(segment: number): boolean {
  return segment >= 1 && segment <= BOBS_27_MAX_DOUBLE_TARGET_CLIP;
}

export function buildTargetPhrase(displayLabel: string): string {
  return `Target: ${displayLabel}`;
}

export function buildFinalTargetBullPhrase(): string {
  return "Final target: Bull";
}

export function buildFinalTargetBullClipPath(): string {
  return `${BOBS_27_CLIP_BASE_PATH}/final-target-bull.wav`;
}

export function buildRoundCompletePhrase(): string {
  return "Round complete";
}

export function buildRoundCompleteClipPath(): string {
  return `${BOBS_27_CLIP_BASE_PATH}/round-complete.wav`;
}

export function buildScoreReducedPhrase(): string {
  return "Score reduced";
}

export function buildScoreReducedClipPath(): string {
  return `${BOBS_27_CLIP_BASE_PATH}/score-reduced.wav`;
}

export function buildPlayerEliminatedPhrase(): string {
  return "Player eliminated";
}

export function buildPlayerEliminatedClipPath(): string {
  return `${BOBS_27_CLIP_BASE_PATH}/player-eliminated.wav`;
}

export function buildGameCompletePhrase(playerNumber: number): string {
  return `Game complete — Player ${playerNumber} wins`;
}

export function buildGameCompleteSlug(playerNumber: number): string {
  return `game-complete-player-${playerNumber}`;
}

export function buildGameCompleteClipPath(playerNumber: number): string {
  return `${BOBS_27_CLIP_BASE_PATH}/${buildGameCompleteSlug(playerNumber)}.wav`;
}

export function canUseGameCompleteClip(playerNumber: number): boolean {
  return playerNumber >= 1 && playerNumber <= BOBS_27_MAX_PLAYER_CLIP;
}

export function getBobs27TargetDoubleClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: BOBS_27_MAX_DOUBLE_TARGET_CLIP }, (_, index) => {
    const segment = index + 1;
    return {
      slug: buildTargetDoubleSlug(segment),
      phrase: buildTargetDoublePhrase(segment),
    };
  });
}

export function getBobs27GameCompleteClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: BOBS_27_MAX_PLAYER_CLIP }, (_, index) => {
    const playerNumber = index + 1;
    return {
      slug: buildGameCompleteSlug(playerNumber),
      phrase: buildGameCompletePhrase(playerNumber),
    };
  });
}

export function getBobs27CalloutPhrase(callout: Bobs27Callout): string {
  switch (callout.type) {
    case "starting-score":
      return buildStartingScorePhrase(callout.score);
    case "target-double":
      return buildTargetDoublePhrase(callout.segment);
    case "target":
      return buildTargetPhrase(callout.displayLabel);
    case "final-target-bull":
      return buildFinalTargetBullPhrase();
    case "round-complete":
      return buildRoundCompletePhrase();
    case "score-reduced":
      return buildScoreReducedPhrase();
    case "player-eliminated":
      return buildPlayerEliminatedPhrase();
    case "game-complete":
      return buildGameCompletePhrase(callout.playerNumber);
  }
}

export function getBobs27CalloutClipPath(callout: Bobs27Callout): string | null {
  switch (callout.type) {
    case "starting-score":
      if (!canUseStartingScoreClip(callout.score)) {
        return null;
      }

      return buildStartingScoreClipPath(callout.score);
    case "target-double":
      if (!canUseTargetDoubleClip(callout.segment)) {
        return null;
      }

      return buildTargetDoubleClipPath(callout.segment);
    case "target":
      return null;
    case "final-target-bull":
      return buildFinalTargetBullClipPath();
    case "round-complete":
      return buildRoundCompleteClipPath();
    case "score-reduced":
      return buildScoreReducedClipPath();
    case "player-eliminated":
      return buildPlayerEliminatedClipPath();
    case "game-complete":
      if (!canUseGameCompleteClip(callout.playerNumber)) {
        return null;
      }

      return buildGameCompleteClipPath(callout.playerNumber);
  }
}
