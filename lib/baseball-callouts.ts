export type BaseballFixedCallout =
  | {
      type: "inning";
      inningNumber: number;
      targetLabel: string;
      targetSegment: number | "bull";
    }
  | { type: "strikeout" }
  | { type: "home-run" }
  | { type: "end-of-inning" }
  | { type: "final-score" };

export const BASEBALL_CLIP_BASE_PATH = "/sounds/baseball";

export const BASEBALL_MAX_INNING_CLIP = 9;

const INNING_ORDINALS: Record<number, string> = {
  1: "First",
  2: "Second",
  3: "Third",
  4: "Fourth",
  5: "Fifth",
  6: "Sixth",
  7: "Seventh",
  8: "Eighth",
  9: "Ninth",
  10: "Tenth",
  11: "Eleventh",
  12: "Twelfth",
};

export function buildInningOrdinal(inningNumber: number): string {
  return INNING_ORDINALS[inningNumber] ?? `${inningNumber}th`;
}

export function buildBaseballInningPhrase(inningNumber: number, targetLabel: string): string {
  return `${buildInningOrdinal(inningNumber)} inning — Target ${targetLabel}`;
}

export function buildBaseballInningSlug(inningNumber: number): string {
  return `inning-${inningNumber}-target-${inningNumber}`;
}

export function buildBaseballInningClipPath(inningNumber: number): string {
  return `${BASEBALL_CLIP_BASE_PATH}/${buildBaseballInningSlug(inningNumber)}.wav`;
}

export function canUseBaseballInningClip(
  inningNumber: number,
  targetSegment: number | "bull",
): boolean {
  return (
    targetSegment !== "bull" &&
    inningNumber === targetSegment &&
    inningNumber >= 1 &&
    inningNumber <= BASEBALL_MAX_INNING_CLIP
  );
}

export function buildStrikeoutPhrase(): string {
  return "Strikeout — no runs scored";
}

export function buildStrikeoutClipPath(): string {
  return `${BASEBALL_CLIP_BASE_PATH}/strikeout.wav`;
}

export function buildHomeRunPhrase(): string {
  return "Home run!";
}

export function buildHomeRunClipPath(): string {
  return `${BASEBALL_CLIP_BASE_PATH}/home-run.wav`;
}

export function buildEndOfInningPhrase(): string {
  return "End of inning";
}

export function buildEndOfInningClipPath(): string {
  return `${BASEBALL_CLIP_BASE_PATH}/end-of-inning.wav`;
}

export function buildFinalScorePhrase(): string {
  return "Final score";
}

export function buildFinalScoreClipPath(): string {
  return `${BASEBALL_CLIP_BASE_PATH}/final-score.wav`;
}

export function getBaseballInningClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: BASEBALL_MAX_INNING_CLIP }, (_, index) => {
    const inningNumber = index + 1;
    return {
      slug: buildBaseballInningSlug(inningNumber),
      phrase: buildBaseballInningPhrase(inningNumber, String(inningNumber)),
    };
  });
}

export function getBaseballFixedClipPath(
  callout: Exclude<BaseballFixedCallout, { type: "inning" }>,
): string {
  switch (callout.type) {
    case "strikeout":
      return buildStrikeoutClipPath();
    case "home-run":
      return buildHomeRunClipPath();
    case "end-of-inning":
      return buildEndOfInningClipPath();
    case "final-score":
      return buildFinalScoreClipPath();
  }
}

export function getBaseballCalloutPhrase(callout: BaseballFixedCallout): string {
  switch (callout.type) {
    case "inning":
      return buildBaseballInningPhrase(callout.inningNumber, callout.targetLabel);
    case "strikeout":
      return buildStrikeoutPhrase();
    case "home-run":
      return buildHomeRunPhrase();
    case "end-of-inning":
      return buildEndOfInningPhrase();
    case "final-score":
      return buildFinalScorePhrase();
  }
}

export function getBaseballCalloutClipPath(callout: BaseballFixedCallout): string | null {
  if (callout.type === "inning") {
    if (!canUseBaseballInningClip(callout.inningNumber, callout.targetSegment)) {
      return null;
    }

    return buildBaseballInningClipPath(callout.inningNumber);
  }

  return getBaseballFixedClipPath(callout);
}
