export type DartMultiplier = "single" | "double" | "triple" | "miss";

export type DartSegment = number | "bull" | "miss";

export interface DartHit {
  segment: DartSegment;
  multiplier: DartMultiplier;
  score: number;
  label: string;
}

export type SegmentRing =
  | "single-inner"
  | "triple"
  | "single-outer"
  | "double"
  | "bull-outer"
  | "bull-inner"
  | "miss";

export interface DartboardSegmentDefinition {
  id: string;
  number: DartSegment;
  ring: SegmentRing;
  path: string;
  hit: DartHit;
  fill: string;
  stroke: string;
}

export interface DartboardSegmentState {
  hovered: boolean;
  active: boolean;
  pressed: boolean;
  selected: boolean;
}
