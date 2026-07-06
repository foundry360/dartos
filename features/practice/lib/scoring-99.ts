import type { PracticeGameId } from "@/types/practice";
import type { DartHit } from "@/types/dart";
import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";

export const SCORING_99_TARGET = 99;

export type Scoring99RoundCount = 10 | 20;

export type Scoring99SessionGameId = "scoring-99-10" | "scoring-99-20";

export interface Scoring99SequenceDart {
  label: string;
  score: number;
}

export interface Scoring99Sequence {
  darts: [Scoring99SequenceDart, Scoring99SequenceDart, Scoring99SequenceDart];
  label: string;
}

const SCORING_99_ROUND_COUNTS: Record<Scoring99SessionGameId, Scoring99RoundCount> = {
  "scoring-99-10": 10,
  "scoring-99-20": 20,
};

const SCORING_DART_SCORES = buildScoringDartScores();

function buildScoringDartScores(): Scoring99SequenceDart[] {
  const scores: Scoring99SequenceDart[] = [];

  for (let segment = 1; segment <= 20; segment += 1) {
    scores.push({ label: `S${segment}`, score: segment });
    scores.push({ label: `D${segment}`, score: segment * 2 });
    scores.push({ label: `T${segment}`, score: segment * 3 });
  }

  scores.push({ label: "25", score: 25 });
  scores.push({ label: "50", score: 50 });

  return scores;
}

function buildSequenceLabel(
  darts: [Scoring99SequenceDart, Scoring99SequenceDart, Scoring99SequenceDart],
): string {
  return darts.map((dart) => dart.label).join(" · ");
}

function buildScoring99Sequences(): Scoring99Sequence[] {
  const sequences: Scoring99Sequence[] = [];
  const seen = new Set<string>();

  for (const first of SCORING_DART_SCORES) {
    for (const second of SCORING_DART_SCORES) {
      for (const third of SCORING_DART_SCORES) {
        if (first.score + second.score + third.score !== SCORING_99_TARGET) {
          continue;
        }

        const key = `${first.label}|${second.label}|${third.label}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        sequences.push({
          darts: [first, second, third],
          label: buildSequenceLabel([first, second, third]),
        });
      }
    }
  }

  return sequences;
}

const SCORING_99_SEQUENCES = buildScoring99Sequences();

export function pickRandomScoring99Sequence(
  exclude?: Scoring99Sequence | null,
): Scoring99Sequence {
  const pool =
    exclude && SCORING_99_SEQUENCES.length > 1
      ? SCORING_99_SEQUENCES.filter((sequence) => sequence.label !== exclude.label)
      : SCORING_99_SEQUENCES;

  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function findScoring99Finish(
  scoreRemaining: number,
  dartsRemaining: number,
): Scoring99SequenceDart[] | null {
  if (dartsRemaining === 0) {
    return scoreRemaining === 0 ? [] : null;
  }

  if (scoreRemaining <= 0 || scoreRemaining > dartsRemaining * 60) {
    return null;
  }

  if (dartsRemaining === 1) {
    const dart = SCORING_DART_SCORES.find((score) => score.score === scoreRemaining);
    return dart ? [dart] : null;
  }

  const shuffled = [...SCORING_DART_SCORES].sort(() => Math.random() - 0.5);

  for (const first of shuffled) {
    if (first.score > scoreRemaining) {
      continue;
    }

    const rest = findScoring99Finish(scoreRemaining - first.score, dartsRemaining - 1);

    if (rest) {
      return [first, ...rest];
    }
  }

  return null;
}

export function recalculateScoring99SequenceAfterMiss(
  currentSequence: Scoring99Sequence,
  dartsThrown: DartHit[],
): Scoring99Sequence | "no-checkout" {
  const scoreSoFar = dartsThrown.reduce((sum, dart) => sum + dart.score, 0);
  const scoreRemaining = SCORING_99_TARGET - scoreSoFar;
  const dartsRemaining = 3 - dartsThrown.length;
  const finish = findScoring99Finish(scoreRemaining, dartsRemaining);

  if (!finish || finish.length !== dartsRemaining) {
    return "no-checkout";
  }

  const updatedDarts = [
    ...currentSequence.darts.slice(0, dartsThrown.length),
    ...finish,
  ] as [Scoring99SequenceDart, Scoring99SequenceDart, Scoring99SequenceDart];

  return {
    darts: updatedDarts,
    label: buildSequenceLabel(updatedDarts),
  };
}

export function isScoring99BaseGame(gameId: PracticeGameId | null): boolean {
  return gameId === "scoring-99";
}

export function isScoring99SessionGame(
  gameId: PracticeGameId | null,
): gameId is Scoring99SessionGameId {
  return gameId === "scoring-99-10" || gameId === "scoring-99-20";
}

export function isScoring99PickerActive(gameId: PracticeGameId | null): boolean {
  return isScoring99BaseGame(gameId) || isScoring99SessionGame(gameId);
}

export function getScoring99RoundCount(gameId: Scoring99SessionGameId): Scoring99RoundCount {
  return SCORING_99_ROUND_COUNTS[gameId];
}

export function isScoring99SessionExact(total: number): boolean {
  return total === SCORING_99_TARGET;
}

export function isScoring99SequenceDartMatch(
  thrown: DartHit,
  expected: Scoring99SequenceDart,
): boolean {
  return thrown.label === expected.label;
}

export function scoring99SequenceDartToPracticeTarget(
  dart: Scoring99SequenceDart,
): PracticeTargetHighlight {
  if (dart.label === "25") {
    return { segment: "bull", multiplier: "single" };
  }

  if (dart.label === "50") {
    return { segment: "bull", multiplier: "double" };
  }

  const match = dart.label.match(/^([SDT])(\d+)$/);

  if (!match) {
    throw new Error(`Unknown scoring 99 dart label: ${dart.label}`);
  }

  const kind = match[1];
  const segment = Number(match[2]);

  return {
    segment,
    multiplier: kind === "S" ? "single" : kind === "D" ? "double" : "triple",
  };
}

export function getScoring99NextPracticeTarget(
  sequence: Scoring99Sequence | null,
  visitDarts: DartHit[],
  noCheckout: boolean,
): PracticeTargetHighlight | null {
  if (noCheckout || !sequence || visitDarts.length >= 3) {
    return null;
  }

  const nextDart = sequence.darts[visitDarts.length];

  if (!nextDart) {
    return null;
  }

  return scoring99SequenceDartToPracticeTarget(nextDart);
}
