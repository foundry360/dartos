import { getScoringBoardRadius } from "@/utils/dartboard/constants";

export interface Point {
  x: number;
  y: number;
}

export function polarToCartesian(
  center: number,
  radius: number,
  angleDegrees: number,
): Point {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

export function describeAnnularSector(
  center: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (innerRadius <= 0) {
    return describeFilledSector(center, outerRadius, startAngle, endAngle);
  }

  const startOuter = polarToCartesian(center, outerRadius, startAngle);
  const endOuter = polarToCartesian(center, outerRadius, endAngle);
  const startInner = polarToCartesian(center, innerRadius, endAngle);
  const endInner = polarToCartesian(center, innerRadius, startAngle);

  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function describeFilledSector(
  center: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(center, outerRadius, startAngle);
  const end = polarToCartesian(center, outerRadius, endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export function describeCircle(center: number, radius: number): string {
  const left = polarToCartesian(center, radius, 180);
  const right = polarToCartesian(center, radius, 0);

  return [
    `M ${left.x} ${left.y}`,
    `A ${radius} ${radius} 0 1 1 ${right.x} ${right.y}`,
    `A ${radius} ${radius} 0 1 1 ${left.x} ${left.y}`,
    "Z",
  ].join(" ");
}

/** Donut ring using even-odd fill rule. */
export function describeRing(
  center: number,
  innerRadius: number,
  outerRadius: number,
): string {
  return [
    describeCircle(center, outerRadius),
    describeCircle(center, innerRadius),
  ].join(" ");
}

export function scaleRadius(radius: number, boardRadius: number): number {
  return radius * boardRadius;
}

export const DEFAULT_BOARD_RADIUS = getScoringBoardRadius();
