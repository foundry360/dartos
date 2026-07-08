export type GolfFixedCallout =
  | { type: "hole"; holeNumber: number; targetLabel: string; targetSegment: number | "bull" }
  | { type: "birdie" }
  | { type: "eagle" }
  | { type: "hole-complete" }
  | { type: "final-score" };

export const GOLF_CLIP_BASE_PATH = "/sounds/golf";

export const GOLF_MAX_HOLE_CLIP = 18;

export function buildGolfHolePhrase(holeNumber: number, targetLabel: string): string {
  return `Hole ${holeNumber} — Target ${targetLabel}`;
}

export function buildGolfHoleSlug(holeNumber: number): string {
  return `hole-${holeNumber}-target-${holeNumber}`;
}

export function buildGolfHoleClipPath(holeNumber: number): string {
  return `${GOLF_CLIP_BASE_PATH}/${buildGolfHoleSlug(holeNumber)}.wav`;
}

export function canUseGolfHoleClip(
  holeNumber: number,
  targetSegment: number | "bull",
): boolean {
  return (
    targetSegment !== "bull" &&
    holeNumber === targetSegment &&
    holeNumber >= 1 &&
    holeNumber <= GOLF_MAX_HOLE_CLIP
  );
}

export function buildBirdiePhrase(): string {
  return "Birdie!";
}

export function buildBirdieClipPath(): string {
  return `${GOLF_CLIP_BASE_PATH}/birdie.wav`;
}

export function buildEaglePhrase(): string {
  return "Eagle!";
}

export function buildEagleClipPath(): string {
  return `${GOLF_CLIP_BASE_PATH}/eagle.wav`;
}

export function buildHoleCompletePhrase(): string {
  return "Hole complete";
}

export function buildHoleCompleteClipPath(): string {
  return `${GOLF_CLIP_BASE_PATH}/hole-complete.wav`;
}

export function buildFinalScorePhrase(): string {
  return "Final score";
}

export function buildFinalScoreClipPath(): string {
  return `${GOLF_CLIP_BASE_PATH}/final-score.wav`;
}

export function getGolfHoleClipEntries(): Array<{ slug: string; phrase: string }> {
  return Array.from({ length: GOLF_MAX_HOLE_CLIP }, (_, index) => {
    const holeNumber = index + 1;
    return {
      slug: buildGolfHoleSlug(holeNumber),
      phrase: buildGolfHolePhrase(holeNumber, String(holeNumber)),
    };
  });
}

export function getGolfFixedClipPath(callout: Exclude<GolfFixedCallout, { type: "hole" }>): string {
  switch (callout.type) {
    case "birdie":
      return buildBirdieClipPath();
    case "eagle":
      return buildEagleClipPath();
    case "hole-complete":
      return buildHoleCompleteClipPath();
    case "final-score":
      return buildFinalScoreClipPath();
  }
}

export function getGolfCalloutPhrase(callout: GolfFixedCallout): string {
  switch (callout.type) {
    case "hole":
      return buildGolfHolePhrase(callout.holeNumber, callout.targetLabel);
    case "birdie":
      return buildBirdiePhrase();
    case "eagle":
      return buildEaglePhrase();
    case "hole-complete":
      return buildHoleCompletePhrase();
    case "final-score":
      return buildFinalScorePhrase();
  }
}

export function getGolfCalloutClipPath(callout: GolfFixedCallout): string | null {
  if (callout.type === "hole") {
    if (!canUseGolfHoleClip(callout.holeNumber, callout.targetSegment)) {
      return null;
    }

    return buildGolfHoleClipPath(callout.holeNumber);
  }

  return getGolfFixedClipPath(callout);
}
