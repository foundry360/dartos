import type { SessionStats } from "@/features/statistics/store/statistics-store";

export function applyDartHit(
  stats: SessionStats,
  segment: "single" | "double" | "triple" | "bull",
): SessionStats {
  const key =
    segment === "single"
      ? "singlesHit"
      : segment === "double"
        ? "doublesHit"
        : segment === "triple"
          ? "triplesHit"
          : "bullHit";

  return {
    ...stats,
    dartsThrown: stats.dartsThrown + 1,
    [key]: stats[key] + 1,
  };
}

export function applyDartMiss(stats: SessionStats): SessionStats {
  return {
    ...stats,
    dartsThrown: stats.dartsThrown + 1,
  };
}

export function applyVisitScore(stats: SessionStats, visitScore: number): SessionStats {
  const recentVisitScores = [...(stats.recentVisitScores ?? []), visitScore].slice(-24);

  return {
    ...stats,
    totalScore: stats.totalScore + visitScore,
    visits: stats.visits + 1,
    highestVisit: Math.max(stats.highestVisit, visitScore),
    visits100Plus: stats.visits100Plus + (visitScore >= 100 ? 1 : 0),
    visits140Plus: stats.visits140Plus + (visitScore >= 140 ? 1 : 0),
    visits180Plus: stats.visits180Plus + (visitScore === 180 ? 1 : 0),
    recentVisitScores,
  };
}

export function applyFirstNineVisit(stats: SessionStats, visitScore: number): SessionStats {
  const updates: Partial<SessionStats> = {};

  if (stats.firstNineVisits < 3) {
    updates.firstNineScore = stats.firstNineScore + visitScore;
    updates.firstNineVisits = stats.firstNineVisits + 1;
  }

  if (stats.firstTwelveVisits < 4) {
    updates.firstTwelveScore = stats.firstTwelveScore + visitScore;
    updates.firstTwelveVisits = stats.firstTwelveVisits + 1;
  }

  if (stats.firstFifteenVisits < 5) {
    updates.firstFifteenScore = stats.firstFifteenScore + visitScore;
    updates.firstFifteenVisits = stats.firstFifteenVisits + 1;
  }

  if (Object.keys(updates).length === 0) {
    return stats;
  }

  return {
    ...stats,
    ...updates,
  };
}

export function applyLegResult(stats: SessionStats, won: boolean, brokeThrow = false): SessionStats {
  const recentLegResults = [...(stats.recentLegResults ?? []), won].slice(-16);

  return {
    ...stats,
    legsPlayed: stats.legsPlayed + 1,
    legsWon: stats.legsWon + (won ? 1 : 0),
    breaksOfThrow: stats.breaksOfThrow + (brokeThrow ? 1 : 0),
    recentLegResults,
  };
}

export function applyCheckoutAttempt(
  stats: SessionStats,
  success: boolean,
  checkoutScore?: number,
): SessionStats {
  const recentCheckoutResults = [...(stats.recentCheckoutResults ?? []), success].slice(-16);

  return {
    ...stats,
    checkoutAttempts: stats.checkoutAttempts + 1,
    checkoutSuccesses: stats.checkoutSuccesses + (success ? 1 : 0),
    highestCheckout:
      success && checkoutScore
        ? Math.max(stats.highestCheckout, checkoutScore)
        : stats.highestCheckout,
    recentCheckoutResults,
  };
}

export function applyMatchResult(stats: SessionStats, won: boolean): SessionStats {
  return {
    ...stats,
    matchesPlayed: stats.matchesPlayed + 1,
    matchesWon: stats.matchesWon + (won ? 1 : 0),
  };
}
