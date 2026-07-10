import { SEGMENT_ORDER } from "@/utils/dartboard/constants";
import type { BotProfile } from "@/types/bot";
import type { DartHit } from "@/types/dart";
import {
  MISS_DART_HIT,
  dartHitFromLabel,
  parseSegmentFromLabel,
} from "@/features/bot/lib/dart-hit-from-label";

function getAdjacentSegment(segment: number): number {
  const index = SEGMENT_ORDER.indexOf(segment as (typeof SEGMENT_ORDER)[number]);

  if (index === -1) {
    return 20;
  }

  const offset = Math.random() < 0.5 ? -1 : 1;
  return SEGMENT_ORDER[(index + offset + SEGMENT_ORDER.length) % SEGMENT_ORDER.length]!;
}

function scatterFromAim(aimLabel: string): DartHit {
  const segment = parseSegmentFromLabel(aimLabel);

  if (segment === "bull") {
    return aimLabel === "50" ? dartHitFromLabel("25") : MISS_DART_HIT;
  }

  if (segment == null || Number.isNaN(segment)) {
    return MISS_DART_HIT;
  }

  const roll = Math.random();

  if (roll < 0.45) {
    return dartHitFromLabel(`S${segment}`);
  }

  if (roll < 0.75) {
    return dartHitFromLabel(`S${getAdjacentSegment(segment)}`);
  }

  if (aimLabel.startsWith("T")) {
    return dartHitFromLabel(`S${segment}`);
  }

  if (aimLabel.startsWith("D")) {
    return Math.random() < 0.6
      ? dartHitFromLabel(`S${segment}`)
      : dartHitFromLabel(`D${segment}`);
  }

  return dartHitFromLabel(`D${segment}`);
}

export function simulateDart(aimLabel: string, profile: BotProfile): DartHit {
  if (Math.random() < profile.missRate) {
    return MISS_DART_HIT;
  }

  if (Math.random() < profile.accuracy) {
    return dartHitFromLabel(aimLabel);
  }

  return scatterFromAim(aimLabel);
}
