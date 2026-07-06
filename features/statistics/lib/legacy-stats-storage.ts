import type { SessionStats } from "@/features/statistics/store/statistics-store";
import { mergeSessionStats } from "@/features/statistics/lib/merge-session-stats";

const USER_STATS_STORAGE_KEY = "dartscorer-statistics";
const SAVED_PLAYER_STATS_STORAGE_KEY = "dartscorer-saved-player-stats";

function readPersistedState<T>(storageKey: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readLegacyUserStats(): SessionStats | null {
  const persisted = readPersistedState<{ state?: { stats?: SessionStats } }>(USER_STATS_STORAGE_KEY);
  return persisted?.state?.stats ?? null;
}

export function readLegacySavedPlayerStats(): Record<string, SessionStats> {
  const persisted = readPersistedState<{ state?: { byProfileId?: Record<string, SessionStats> } }>(
    SAVED_PLAYER_STATS_STORAGE_KEY,
  );

  return persisted?.state?.byProfileId ?? {};
}

export function clearLegacyStatsStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(USER_STATS_STORAGE_KEY);
  window.localStorage.removeItem(SAVED_PLAYER_STATS_STORAGE_KEY);
}

export function mergeLegacyUserStats(
  remote: SessionStats | null,
  current: SessionStats,
): SessionStats {
  const legacy = readLegacyUserStats();
  return mergeSessionStats(current, legacy, remote);
}

export function mergeLegacySavedPlayerStats(
  remoteByProfileId: Record<string, SessionStats>,
): Record<string, SessionStats> {
  const legacyByProfileId = readLegacySavedPlayerStats();
  const profileIds = new Set([
    ...Object.keys(remoteByProfileId),
    ...Object.keys(legacyByProfileId),
  ]);
  const merged: Record<string, SessionStats> = {};

  for (const profileId of profileIds) {
    merged[profileId] = mergeSessionStats(
      legacyByProfileId[profileId],
      remoteByProfileId[profileId],
    );
  }

  return merged;
}
