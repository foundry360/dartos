import {
  initialStats,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";

function concatRolling<T>(left: T[], right: T[], max: number): T[] {
  return [...left, ...right].slice(-max);
}

export function addSessionStats(
  base: SessionStats,
  delta: SessionStats,
): SessionStats {
  const normalizedBase = { ...initialStats, ...base };
  const normalizedDelta = { ...initialStats, ...delta };

  return {
    dartsThrown: normalizedBase.dartsThrown + normalizedDelta.dartsThrown,
    totalScore: normalizedBase.totalScore + normalizedDelta.totalScore,
    visits: normalizedBase.visits + normalizedDelta.visits,
    highestVisit: Math.max(normalizedBase.highestVisit, normalizedDelta.highestVisit),
    visits100Plus: normalizedBase.visits100Plus + normalizedDelta.visits100Plus,
    visits140Plus: normalizedBase.visits140Plus + normalizedDelta.visits140Plus,
    visits180Plus: normalizedBase.visits180Plus + normalizedDelta.visits180Plus,
    highestCheckout: Math.max(normalizedBase.highestCheckout, normalizedDelta.highestCheckout),
    firstNineScore: normalizedBase.firstNineScore + normalizedDelta.firstNineScore,
    firstNineVisits: normalizedBase.firstNineVisits + normalizedDelta.firstNineVisits,
    firstTwelveScore: normalizedBase.firstTwelveScore + normalizedDelta.firstTwelveScore,
    firstTwelveVisits: normalizedBase.firstTwelveVisits + normalizedDelta.firstTwelveVisits,
    firstFifteenScore: normalizedBase.firstFifteenScore + normalizedDelta.firstFifteenScore,
    firstFifteenVisits: normalizedBase.firstFifteenVisits + normalizedDelta.firstFifteenVisits,
    singlesHit: normalizedBase.singlesHit + normalizedDelta.singlesHit,
    doublesHit: normalizedBase.doublesHit + normalizedDelta.doublesHit,
    triplesHit: normalizedBase.triplesHit + normalizedDelta.triplesHit,
    bullHit: normalizedBase.bullHit + normalizedDelta.bullHit,
    checkoutAttempts: normalizedBase.checkoutAttempts + normalizedDelta.checkoutAttempts,
    checkoutSuccesses: normalizedBase.checkoutSuccesses + normalizedDelta.checkoutSuccesses,
    matchesPlayed: normalizedBase.matchesPlayed + normalizedDelta.matchesPlayed,
    matchesWon: normalizedBase.matchesWon + normalizedDelta.matchesWon,
    legsPlayed: normalizedBase.legsPlayed + normalizedDelta.legsPlayed,
    legsWon: normalizedBase.legsWon + normalizedDelta.legsWon,
    breaksOfThrow: normalizedBase.breaksOfThrow + normalizedDelta.breaksOfThrow,
    recentVisitScores: concatRolling(
      normalizedBase.recentVisitScores,
      normalizedDelta.recentVisitScores,
      24,
    ),
    recentLegResults: concatRolling(
      normalizedBase.recentLegResults,
      normalizedDelta.recentLegResults,
      16,
    ),
    recentCheckoutResults: concatRolling(
      normalizedBase.recentCheckoutResults,
      normalizedDelta.recentCheckoutResults,
      16,
    ),
  };
}
