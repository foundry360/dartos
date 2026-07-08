export type Checkout121Callout =
  | { type: "game-title" }
  | { type: "starting-target"; score: number }
  | { type: "remaining"; score: number }
  | { type: "next-target"; score: number }
  | { type: "target"; score: number }
  | { type: "visit-complete" }
  | { type: "three-darts-remaining" }
  | { type: "last-dart" }
  | { type: "checkout" }
  | { type: "checkout-121" }
  | { type: "target-cleared" }
  | { type: "no-checkout" }
  | { type: "target-remains"; score: number }
  | { type: "new-high-score" }
  | { type: "personal-best" }
  | { type: "challenge-complete" }
  | { type: "highest-checkout"; score: number };

export const CHECKOUT_121_CLIP_BASE_PATH = "/sounds/checkout-121";

export const CHECKOUT_121_MIN_SCORE_CLIP = 121;

export const CHECKOUT_121_MAX_SCORE_CLIP = 170;

export const CHECKOUT_121_CLASSIC_CHECKOUT_SCORE = 121;

export function buildGameTitlePhrase(): string {
  return "121 Checkout";
}

export function buildGameTitleClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/121-checkout.wav`;
}

export function buildStartingTargetPhrase(score: number): string {
  return `Starting target: ${score}`;
}

export function buildStartingTargetSlug(score: number): string {
  return `starting-target-${score}`;
}

export function buildStartingTargetClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildStartingTargetSlug(score)}.wav`;
}

export function buildRemainingPhrase(score: number): string {
  return `${score} remaining`;
}

export function buildRemainingSlug(score: number): string {
  return `remaining-${score}`;
}

export function buildRemainingClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildRemainingSlug(score)}.wav`;
}

export function buildNextTargetPhrase(score: number): string {
  return `Next target: ${score}`;
}

export function buildNextTargetSlug(score: number): string {
  return `next-target-${score}`;
}

export function buildNextTargetClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildNextTargetSlug(score)}.wav`;
}

export function buildTargetPhrase(score: number): string {
  return `Target: ${score}`;
}

export function buildTargetSlug(score: number): string {
  return `target-${score}`;
}

export function buildTargetClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildTargetSlug(score)}.wav`;
}

export function buildVisitCompletePhrase(): string {
  return "Visit complete";
}

export function buildVisitCompleteClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/visit-complete.wav`;
}

export function buildThreeDartsRemainingPhrase(): string {
  return "Three darts remaining";
}

export function buildThreeDartsRemainingClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/three-darts-remaining.wav`;
}

export function buildLastDartPhrase(): string {
  return "Last dart";
}

export function buildLastDartClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/last-dart.wav`;
}

export function buildCheckoutPhrase(): string {
  return "Checkout!";
}

export function buildCheckoutClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/checkout.wav`;
}

export function buildCheckout121Phrase(): string {
  return "121 checkout";
}

export function buildCheckout121ClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/checkout-121.wav`;
}

export function buildTargetClearedPhrase(): string {
  return "Target cleared";
}

export function buildTargetClearedClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/target-cleared.wav`;
}

export function buildNoCheckoutPhrase(): string {
  return "No checkout";
}

export function buildNoCheckoutClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/no-checkout.wav`;
}

export function buildTargetRemainsPhrase(score: number): string {
  return `Target remains ${score}`;
}

export function buildTargetRemainsSlug(score: number): string {
  return `target-remains-${score}`;
}

export function buildTargetRemainsClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildTargetRemainsSlug(score)}.wav`;
}

export function buildNewHighScorePhrase(): string {
  return "New high score";
}

export function buildNewHighScoreClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/new-high-score.wav`;
}

export function buildPersonalBestPhrase(): string {
  return "Personal best";
}

export function buildPersonalBestClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/personal-best.wav`;
}

export function buildChallengeCompletePhrase(): string {
  return "Challenge complete";
}

export function buildChallengeCompleteClipPath(): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/challenge-complete.wav`;
}

export function buildHighestCheckoutPhrase(score: number): string {
  return `Highest checkout: ${score}`;
}

export function buildHighestCheckoutSlug(score: number): string {
  return `highest-checkout-${score}`;
}

export function buildHighestCheckoutClipPath(score: number): string {
  return `${CHECKOUT_121_CLIP_BASE_PATH}/${buildHighestCheckoutSlug(score)}.wav`;
}

export function canUseCheckout121ScoreClip(score: number): boolean {
  return (
    score >= CHECKOUT_121_MIN_SCORE_CLIP &&
    score <= CHECKOUT_121_MAX_SCORE_CLIP
  );
}

export function getCheckout121ScoreClipEntries(
  prefix: string,
  buildPhrase: (score: number) => string,
  buildSlug: (score: number) => string,
): Array<{ slug: string; phrase: string }> {
  const entries: Array<{ slug: string; phrase: string }> = [];

  for (
    let score = CHECKOUT_121_MIN_SCORE_CLIP;
    score <= CHECKOUT_121_MAX_SCORE_CLIP;
    score += 1
  ) {
    entries.push({
      slug: buildSlug(score),
      phrase: buildPhrase(score),
    });
  }

  return entries;
}

export function getCheckout121CalloutPhrase(callout: Checkout121Callout): string {
  switch (callout.type) {
    case "game-title":
      return buildGameTitlePhrase();
    case "starting-target":
      return buildStartingTargetPhrase(callout.score);
    case "remaining":
      return buildRemainingPhrase(callout.score);
    case "next-target":
      return buildNextTargetPhrase(callout.score);
    case "target":
      return buildTargetPhrase(callout.score);
    case "visit-complete":
      return buildVisitCompletePhrase();
    case "three-darts-remaining":
      return buildThreeDartsRemainingPhrase();
    case "last-dart":
      return buildLastDartPhrase();
    case "checkout":
      return buildCheckoutPhrase();
    case "checkout-121":
      return buildCheckout121Phrase();
    case "target-cleared":
      return buildTargetClearedPhrase();
    case "no-checkout":
      return buildNoCheckoutPhrase();
    case "target-remains":
      return buildTargetRemainsPhrase(callout.score);
    case "new-high-score":
      return buildNewHighScorePhrase();
    case "personal-best":
      return buildPersonalBestPhrase();
    case "challenge-complete":
      return buildChallengeCompletePhrase();
    case "highest-checkout":
      return buildHighestCheckoutPhrase(callout.score);
  }
}

export function getCheckout121CalloutClipPath(callout: Checkout121Callout): string | null {
  switch (callout.type) {
    case "game-title":
      return buildGameTitleClipPath();
    case "starting-target":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildStartingTargetClipPath(callout.score)
        : null;
    case "remaining":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildRemainingClipPath(callout.score)
        : null;
    case "next-target":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildNextTargetClipPath(callout.score)
        : null;
    case "target":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildTargetClipPath(callout.score)
        : null;
    case "visit-complete":
      return buildVisitCompleteClipPath();
    case "three-darts-remaining":
      return buildThreeDartsRemainingClipPath();
    case "last-dart":
      return buildLastDartClipPath();
    case "checkout":
      return buildCheckoutClipPath();
    case "checkout-121":
      return buildCheckout121ClipPath();
    case "target-cleared":
      return buildTargetClearedClipPath();
    case "no-checkout":
      return buildNoCheckoutClipPath();
    case "target-remains":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildTargetRemainsClipPath(callout.score)
        : null;
    case "new-high-score":
      return buildNewHighScoreClipPath();
    case "personal-best":
      return buildPersonalBestClipPath();
    case "challenge-complete":
      return buildChallengeCompleteClipPath();
    case "highest-checkout":
      return canUseCheckout121ScoreClip(callout.score)
        ? buildHighestCheckoutClipPath(callout.score)
        : null;
  }
}
