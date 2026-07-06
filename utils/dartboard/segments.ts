import type { DartHit, DartboardSegmentDefinition, SegmentRing } from "@/types/dart";
import {
  DEFAULT_BOARD_THEME_ID,
  getBoardThemeColors,
  type BoardThemeColors,
} from "@/lib/board-themes";
import {
  BOARD_CENTER,
  BOARD_RADII,
  LABEL_OUTSET_FROM_DOUBLE,
  RING_RENDER_ORDER,
  SEGMENT_ANGLE,
  SEGMENT_ORDER,
} from "@/utils/dartboard/constants";
import {
  DEFAULT_BOARD_RADIUS,
  describeAnnularSector,
  describeCircle,
  describeRing,
  polarToCartesian,
  scaleRadius,
} from "@/utils/dartboard/geometry";

function createHit(
  segment: DartHit["segment"],
  multiplier: DartHit["multiplier"],
  score: number,
  label: string,
): DartHit {
  return { segment, multiplier, score, label };
}

function ringRenderIndex(ring: SegmentRing): number {
  const index = RING_RENDER_ORDER.indexOf(ring as (typeof RING_RENDER_ORDER)[number]);
  return index === -1 ? 0 : index;
}

function wedgeSingleColor(index: number, colors: BoardThemeColors): string {
  return index % 2 === 0 ? colors.segmentPrimary : colors.segmentSecondary;
}

/**
 * Board colors alternate by wedge position (index), not segment number.
 */
function wedgeFill(
  index: number,
  ring: SegmentRing,
  colors: BoardThemeColors,
): string {
  const evenIndex = index % 2 === 0;

  if (ring === "triple" || ring === "double") {
    if (colors.segmentMatchedScoringRings) {
      const wedgeColor = wedgeSingleColor(index, colors);

      if (colors.scoringRingOnSegmentPrimary && colors.scoringRingOnSegmentSecondary) {
        return wedgeColor === colors.segmentPrimary
          ? colors.scoringRingOnSegmentPrimary
          : colors.scoringRingOnSegmentSecondary;
      }

      const ringAccent =
        colors.scoringRingPrimary ??
        (colors.whiteScoringRingsOn === "segmentPrimary"
          ? colors.segmentPrimary
          : colors.segmentSecondary);
      const whiteOnPrimary = colors.whiteScoringRingsOn === "segmentPrimary";
      const wedgeGetsWhite = whiteOnPrimary
        ? wedgeColor === colors.segmentPrimary
        : wedgeColor === colors.segmentSecondary;

      return wedgeGetsWhite ? "#ffffff" : ringAccent;
    }

    if (colors.alternateScoringRings && colors.scoringRingAccent) {
      return evenIndex ? colors.triple : colors.scoringRingAccent;
    }

    return ring === "triple" ? colors.triple : colors.double;
  }

  if (ring === "single-inner" || ring === "single-outer") {
    return wedgeSingleColor(index, colors);
  }

  if (ring === "bull-outer") {
    return colors.bullOuter;
  }

  if (ring === "bull-inner") {
    return colors.bullInner;
  }

  return colors.segmentPrimary;
}

function buildNumberSegments(
  boardRadius: number,
  colors: BoardThemeColors,
): DartboardSegmentDefinition[] {
  const segments: DartboardSegmentDefinition[] = [];
  const center = BOARD_CENTER;

  const doubleInner = scaleRadius(BOARD_RADII.doubleInner, boardRadius);
  const doubleOuter = scaleRadius(BOARD_RADII.doubleOuter, boardRadius);
  const tripleInner = scaleRadius(BOARD_RADII.tripleInner, boardRadius);
  const tripleOuter = scaleRadius(BOARD_RADII.tripleOuter, boardRadius);
  const bullOuter = scaleRadius(BOARD_RADII.bullOuter, boardRadius);

  SEGMENT_ORDER.forEach((number, index) => {
    const startAngle = index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
    const endAngle = startAngle + SEGMENT_ANGLE;

    const rings: Array<{
      id: string;
      ring: SegmentRing;
      inner: number;
      outer: number;
      hit: DartHit;
    }> = [
      {
        id: `SI${number}`,
        ring: "single-inner",
        inner: bullOuter,
        outer: tripleInner,
        hit: createHit(number, "single", number, `S${number}`),
      },
      {
        id: `T${number}`,
        ring: "triple",
        inner: tripleInner,
        outer: tripleOuter,
        hit: createHit(number, "triple", number * 3, `T${number}`),
      },
      {
        id: `S${number}`,
        ring: "single-outer",
        inner: tripleOuter,
        outer: doubleInner,
        hit: createHit(number, "single", number, `S${number}`),
      },
      {
        id: `D${number}`,
        ring: "double",
        inner: doubleInner,
        outer: doubleOuter,
        hit: createHit(number, "double", number * 2, `D${number}`),
      },
    ];

    rings.forEach((ring) => {
      segments.push({
        id: ring.id,
        number,
        ring: ring.ring,
        path: describeAnnularSector(center, ring.inner, ring.outer, startAngle, endAngle),
        hit: ring.hit,
        fill: wedgeFill(index, ring.ring, colors),
        stroke: colors.wireDark,
      });
    });
  });

  return segments;
}

function bullOuterBorderColor(colors: BoardThemeColors): string {
  if (colors.bullOuter === colors.segmentSecondary) {
    return colors.segmentPrimary;
  }

  if (colors.bullOuter === colors.segmentPrimary) {
    return colors.segmentSecondary;
  }

  return colors.segmentSecondary;
}

function buildBullSegments(
  boardRadius: number,
  colors: BoardThemeColors,
): DartboardSegmentDefinition[] {
  const center = BOARD_CENTER;
  const bullOuter = scaleRadius(BOARD_RADII.bullOuter, boardRadius);
  const bullInner = scaleRadius(BOARD_RADII.bullInner, boardRadius);

  return [
    {
      id: "BULL25",
      number: "bull",
      ring: "bull-outer",
      path: describeRing(center, bullInner, bullOuter),
      hit: createHit("bull", "single", 25, "25"),
      fill: colors.bullOuter,
      stroke: bullOuterBorderColor(colors),
    },
    {
      id: "BULL50",
      number: "bull",
      ring: "bull-inner",
      path: describeCircle(center, bullInner),
      hit: createHit("bull", "double", 50, "50"),
      fill: colors.bullInner,
      stroke: colors.wireDark,
    },
  ];
}

function buildWireSpiders(
  boardRadius: number,
  colors: BoardThemeColors,
): DartboardSegmentDefinition[] {
  const center = BOARD_CENTER;
  const doubleOuter = scaleRadius(BOARD_RADII.doubleOuter, boardRadius);
  const bullOuter = scaleRadius(BOARD_RADII.bullOuter, boardRadius);

  return SEGMENT_ORDER.map((number, index) => {
    const angle = index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
    const outer = polarToCartesian(center, doubleOuter, angle);
    const inner = polarToCartesian(center, bullOuter, angle);

    return {
      id: `WIRE${number}`,
      number: "miss" as const,
      ring: "miss" as const,
      path: `M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`,
      hit: createHit("miss", "miss", 0, "Miss"),
      fill: "none",
      stroke: colors.wire,
    };
  });
}

export interface DartboardLabel {
  id: string;
  number: number;
  x: number;
  y: number;
  rotation: number;
  fill: string;
}

/** Bottom-half labels are rotated 180° so numbers read upright from outside the board. */
export function getLabelRotation(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;

  if (normalized > 90 && normalized < 270) {
    return angle + 180;
  }

  return angle;
}

export function buildDartboardLabels(
  boardRadius: number = DEFAULT_BOARD_RADIUS,
  colors: BoardThemeColors = getBoardThemeColors(DEFAULT_BOARD_THEME_ID),
): DartboardLabel[] {
  const center = BOARD_CENTER;
  const doubleOuter = scaleRadius(BOARD_RADII.doubleOuter, boardRadius);
  const labelRadius = doubleOuter + LABEL_OUTSET_FROM_DOUBLE;

  return SEGMENT_ORDER.map((number, index) => {
    const angle = index * SEGMENT_ANGLE;
    const point = polarToCartesian(center, labelRadius, angle);

    return {
      id: `LABEL${number}`,
      number,
      x: point.x,
      y: point.y,
      rotation: getLabelRotation(angle),
      fill: colors.label,
    };
  });
}

export interface DartboardWireRing {
  id: string;
  radius: number;
}

export function buildDartboardWireRings(
  boardRadius: number = DEFAULT_BOARD_RADIUS,
): DartboardWireRing[] {
  return [
    { id: "wire-triple-inner", radius: scaleRadius(BOARD_RADII.tripleInner, boardRadius) },
    { id: "wire-triple-outer", radius: scaleRadius(BOARD_RADII.tripleOuter, boardRadius) },
    { id: "wire-double-inner", radius: scaleRadius(BOARD_RADII.doubleInner, boardRadius) },
  ];
}

export function buildDartboardSegments(
  boardRadius: number = DEFAULT_BOARD_RADIUS,
  colors: BoardThemeColors = getBoardThemeColors(DEFAULT_BOARD_THEME_ID),
): DartboardSegmentDefinition[] {
  const scoring = [
    ...buildNumberSegments(boardRadius, colors),
    ...buildBullSegments(boardRadius, colors),
  ];

  scoring.sort((a, b) => {
    const layerDiff = ringRenderIndex(a.ring) - ringRenderIndex(b.ring);
    if (layerDiff !== 0) {
      return layerDiff;
    }

    return 0;
  });

  const wires = buildWireSpiders(boardRadius, colors);

  return [...scoring, ...wires];
}

export function findSegmentByHit(
  segments: DartboardSegmentDefinition[],
  hit: DartHit,
): DartboardSegmentDefinition | undefined {
  return segments.find((segment) => {
    if (segment.id.startsWith("WIRE")) {
      return false;
    }

    if (segment.hit.segment !== hit.segment) {
      return false;
    }

    if (hit.segment === "bull") {
      return hit.multiplier === "double"
        ? segment.ring === "bull-inner"
        : segment.ring === "bull-outer";
    }

    if (hit.segment === "miss") {
      return false;
    }

    switch (hit.multiplier) {
      case "single":
        return segment.ring === "single-inner" || segment.ring === "single-outer";
      case "double":
        return segment.ring === "double";
      case "triple":
        return segment.ring === "triple";
      default:
        return false;
    }
  });
}

export function isEvenOddRing(ring: SegmentRing): boolean {
  return ring === "bull-outer";
}
