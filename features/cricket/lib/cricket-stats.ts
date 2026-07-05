import { CRICKET_TARGETS } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type {
  CricketGameState,
  CricketHistoryEntry,
  CricketPlayerState,
} from "@/types/cricket";
import { isCricketTarget, marksFromHit } from "@/features/cricket/lib/cricket-engine";

export interface CricketPlayerMatchStats {
  dartsThrown: number;
  marks: number;
  mpr: number;
  triples: number;
  doubles: number;
  misses: number;
  points: number;
  segmentsClosed: number;
}

function createEmptyStats(player: CricketPlayerState): CricketPlayerMatchStats {
  return {
    dartsThrown: 0,
    marks: 0,
    mpr: 0,
    triples: 0,
    doubles: 0,
    misses: 0,
    points: player.score,
    segmentsClosed: CRICKET_TARGETS.filter((target) => player.marks[target] >= 3).length,
  };
}

function applyDartToStats(stats: CricketPlayerMatchStats, hit: DartHit): void {
  stats.dartsThrown += 1;

  if (hit.segment === "miss") {
    stats.misses += 1;
    return;
  }

  if (!isCricketTarget(hit.segment)) {
    return;
  }

  stats.marks += marksFromHit(hit);

  if (hit.multiplier === "triple") {
    stats.triples += 1;
  } else if (hit.multiplier === "double") {
    stats.doubles += 1;
  }
}

function finalizeMpr(stats: CricketPlayerMatchStats): void {
  if (stats.dartsThrown === 0) {
    stats.mpr = 0;
    return;
  }

  stats.mpr = Math.round((stats.marks / (stats.dartsThrown / 3)) * 100) / 100;
}

export function computeCricketMatchStats(
  players: CricketPlayerState[],
  currentPlayerIndex: number,
  history: CricketHistoryEntry[],
  visitDarts: DartHit[],
): CricketPlayerMatchStats[] {
  const stats = players.map(createEmptyStats);

  for (const entry of history) {
    const playerStats = stats[entry.playerIndex];
    if (playerStats) {
      applyDartToStats(playerStats, entry.dart);
    }
  }

  const currentStats = stats[currentPlayerIndex];
  if (currentStats) {
    for (const hit of visitDarts) {
      applyDartToStats(currentStats, hit);
    }
  }

  for (const playerStats of stats) {
    finalizeMpr(playerStats);
  }

  return stats;
}

export function computeCricketMatchStatsFromGame(
  game: Pick<CricketGameState, "players" | "currentPlayerIndex" | "history" | "visitDarts">,
): CricketPlayerMatchStats[] {
  return computeCricketMatchStats(
    game.players,
    game.currentPlayerIndex,
    game.history,
    game.visitDarts,
  );
}
