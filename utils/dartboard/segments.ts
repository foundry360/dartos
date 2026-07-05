import type { DartHit, DartboardSegmentDefinition, SegmentRing } from "@/types/dart";
import {
  BOARD_CENTER,
  BOARD_COLORS,
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

/**
 * Board colors alternate by wedge position (index), not segment number.
 * Singles: black/cream. Triple & double: green/red.
 */
function wedgeFill(index: number, ring: SegmentRing): string {
  const evenIndex = index % 2 === 0;

  if (ring === "triple" || ring === "double") {
    return evenIndex ? BOARD_COLORS.green : BOARD_COLORS.red;
  }

  if (ring === "single-inner" || ring === "single-outer") {
    return evenIndex ? BOARD_COLORS.black : BOARD_COLORS.cream;
  }

  if (ring === "bull-outer") {
    return BOARD_COLORS.green;
  }

  if (ring === "bull-inner") {
    return BOARD_COLORS.red;
  }

  return BOARD_COLORS.black;
}

function buildNumberSegments(boardRadius: number): DartboardSegmentDefinition[] {
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
        fill: wedgeFill(index, ring.ring),
        stroke: BOARD_COLORS.wireDark,
      });
    });
  });

  return segments;
}

function buildBullSegments(boardRadius: number): DartboardSegmentDefinition[] {
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
      fill: BOARD_COLORS.green,
      stroke: BOARD_COLORS.wireDark,
    },
    {
      id: "BULL50",
      number: "bull",
      ring: "bull-inner",
      path: describeCircle(center, bullInner),
      hit: createHit("bull", "double", 50, "50"),
      fill: BOARD_COLORS.red,
      stroke: BOARD_COLORS.wireDark,
    },
  ];
}

function buildWireSpiders(boardRadius: number): DartboardSegmentDefinition[] {
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
      stroke: BOARD_COLORS.wire,
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

export function buildDartboardLabels(
  boardRadius: number = DEFAULT_BOARD_RADIUS,
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
      rotation: angle,
      fill: BOARD_COLORS.cream,
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
): DartboardSegmentDefinition[] {
  const scoring = [...buildNumberSegments(boardRadius), ...buildBullSegments(boardRadius)];

  scoring.sort((a, b) => {
    const layerDiff = ringRenderIndex(a.ring) - ringRenderIndex(b.ring);
    if (layerDiff !== 0) {
      return layerDiff;
    }

    return 0;
  });

  const wires = buildWireSpiders(boardRadius);

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
