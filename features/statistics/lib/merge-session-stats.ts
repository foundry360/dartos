import {
  initialStats,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";

function normalizeSessionStats(stats: Partial<SessionStats> | null | undefined): SessionStats {
  if (!stats) {
    return initialStats;
  }

  return {
    ...initialStats,
    ...stats,
    recentVisitScores: stats.recentVisitScores ?? [],
    recentLegResults: stats.recentLegResults ?? [],
    recentCheckoutResults: stats.recentCheckoutResults ?? [],
  };
}

function statsActivityScore(stats: SessionStats): number {
  return stats.dartsThrown * 1_000_000 + stats.legsPlayed * 1_000 + stats.matchesPlayed;
}

export function pickAuthoritativeStats(local: SessionStats, remote: SessionStats): SessionStats {
  const normalizedLocal = normalizeSessionStats(local);
  const normalizedRemote = normalizeSessionStats(remote);

  if (statsActivityScore(normalizedLocal) > statsActivityScore(normalizedRemote)) {
    return normalizedLocal;
  }

  if (statsActivityScore(normalizedRemote) > statsActivityScore(normalizedLocal)) {
    return normalizedRemote;
  }

  const localHistoryLength =
    normalizedLocal.recentVisitScores.length +
    normalizedLocal.recentLegResults.length +
    normalizedLocal.recentCheckoutResults.length;
  const remoteHistoryLength =
    normalizedRemote.recentVisitScores.length +
    normalizedRemote.recentLegResults.length +
    normalizedRemote.recentCheckoutResults.length;

  return localHistoryLength >= remoteHistoryLength ? normalizedLocal : normalizedRemote;
}

export function mergeSessionStats(
  ...sources: Array<SessionStats | null | undefined>
): SessionStats {
  return sources
    .map((source) => normalizeSessionStats(source))
    .reduce((best, current) => pickAuthoritativeStats(best, current), initialStats);
}
