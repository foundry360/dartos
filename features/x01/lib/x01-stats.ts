import type { DartHit } from "@/types/dart";
import type { X01GameState, X01HistoryEntry, X01PlayerState } from "@/types/x01";
import { calculateThreeDartAverage } from "@/features/x01/lib/x01-engine";

export interface X01PlayerMatchStats {
  dartsThrown: number;
  visitCount: number;
  threeDartAverage: number;
  misses: number;
  doubles: number;
  triples: number;
  busts: number;
  checkoutSuccesses: number;
}

function createEmptyStats(player: X01PlayerState): X01PlayerMatchStats {
  return {
    dartsThrown: 0,
    visitCount: player.visitScores.length,
    threeDartAverage: calculateThreeDartAverage(player),
    misses: 0,
    doubles: 0,
    triples: 0,
    busts: 0,
    checkoutSuccesses: player.checkoutSuccesses,
  };
}

function applyDartToStats(stats: X01PlayerMatchStats, hit: DartHit, bust: boolean): void {
  stats.dartsThrown += 1;

  if (hit.segment === "miss") {
    stats.misses += 1;
    return;
  }

  if (hit.multiplier === "triple") {
    stats.triples += 1;
  } else if (hit.multiplier === "double") {
    stats.doubles += 1;
  }

  if (bust) {
    stats.busts += 1;
  }
}

function applyHistoryEntry(stats: X01PlayerMatchStats, entry: X01HistoryEntry): void {
  applyDartToStats(stats, entry.dart, entry.bust);
}

export function computeX01MatchStats(
  players: X01PlayerState[],
  history: X01HistoryEntry[],
): X01PlayerMatchStats[] {
  const stats = players.map((player) => createEmptyStats(player));

  for (const entry of history) {
    const playerStats = stats[entry.playerIndex];
    if (playerStats) {
      applyHistoryEntry(playerStats, entry);
    }
  }

  for (const [index, playerStats] of stats.entries()) {
    const player = players[index];
    if (!player) {
      continue;
    }

    playerStats.visitCount = player.visitScores.length;
    playerStats.checkoutSuccesses = player.checkoutSuccesses;
    playerStats.threeDartAverage = calculateThreeDartAverage(player);
  }

  return stats;
}

export function computeX01MatchStatsFromGame(
  game: Pick<X01GameState, "players" | "history">,
): X01PlayerMatchStats[] {
  return computeX01MatchStats(game.players, game.history);
}
