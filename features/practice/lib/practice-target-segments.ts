import type { DartHit, DartboardSegmentDefinition } from "@/types/dart";

export type PracticeTargetHighlight = Pick<DartHit, "segment" | "multiplier">;

export function findDartboardSegmentIdsForPracticeTarget(
  segments: DartboardSegmentDefinition[],
  target: PracticeTargetHighlight,
): string[] {
  return segments
    .filter(
      (segment) =>
        segment.ring !== "miss" &&
        !segment.id.startsWith("WIRE") &&
        segment.hit.segment === target.segment &&
        segment.hit.multiplier === target.multiplier,
    )
    .map((segment) => segment.id);
}

export function findDartboardSegmentsForPracticeTarget(
  segments: DartboardSegmentDefinition[],
  target: PracticeTargetHighlight,
) {
  const ids = new Set(findDartboardSegmentIdsForPracticeTarget(segments, target));

  return segments.filter((segment) => ids.has(segment.id));
}

export function findDartboardBullSegments(segments: DartboardSegmentDefinition[]) {
  return segments.filter(
    (segment) => segment.ring === "bull-outer" || segment.ring === "bull-inner",
  );
}

export function findDartboardSegmentsForSegment(
  segments: DartboardSegmentDefinition[],
  segment: number | "bull",
) {
  if (segment === "bull") {
    return findDartboardBullSegments(segments);
  }

  return segments.filter(
    (entry) => entry.hit.segment === segment && entry.ring !== "miss",
  );
}
