import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import {
  applyCheckoutAttempt,
  applyDartHit,
  applyDartMiss,
  applyFirstNineVisit,
  applyLegResult,
  applyMatchResult,
  applyVisitScore,
} from "@/features/statistics/lib/apply-session-stat-event";
import { isMatchInProgress } from "@/features/statistics/lib/is-match-in-progress";
import { usePendingMatchStatsStore } from "@/features/statistics/store/pending-match-stats-store";
import {
  initialStats,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";

function mutateAccountStats(
  updater: Parameters<ReturnType<typeof usePendingMatchStatsStore.getState>["mutateAccount"]>[0],
) {
  if (isMatchInProgress()) {
    usePendingMatchStatsStore.getState().mutateAccount(updater);
    return;
  }

  useStatisticsStore.setState((state) => ({
    stats: updater(state.stats),
  }));
}

function mutateSavedPlayerStats(
  profileId: string,
  updater: Parameters<
    ReturnType<typeof usePendingMatchStatsStore.getState>["mutateSavedPlayer"]
  >[1],
) {
  if (isMatchInProgress()) {
    usePendingMatchStatsStore.getState().mutateSavedPlayer(profileId, updater);
    return;
  }

  useSavedPlayerStatsStore.setState((state) => ({
    byProfileId: {
      ...state.byProfileId,
      [profileId]: updater(state.byProfileId[profileId] ?? initialStats),
    },
  }));
}

export function recordDartHitForProfile(
  profileId: string | undefined,
  segment: "single" | "double" | "triple" | "bull",
) {
  if (isAccountProfileId(profileId)) {
    mutateAccountStats((stats) => applyDartHit(stats, segment));
    return;
  }

  if (isCloudProfileId(profileId)) {
    mutateSavedPlayerStats(profileId, (stats) => applyDartHit(stats, segment));
  }
}

export function recordDartMissForProfile(profileId: string | undefined) {
  if (isAccountProfileId(profileId)) {
    mutateAccountStats((stats) => applyDartMiss(stats));
    return;
  }

  if (isCloudProfileId(profileId)) {
    mutateSavedPlayerStats(profileId, (stats) => applyDartMiss(stats));
  }
}

export function recordVisitScoreForProfile(profileId: string | undefined, visitScore: number) {
  if (isAccountProfileId(profileId)) {
    mutateAccountStats((stats) => applyVisitScore(stats, visitScore));
    return;
  }

  if (isCloudProfileId(profileId)) {
    mutateSavedPlayerStats(profileId, (stats) => applyVisitScore(stats, visitScore));
  }
}

export function recordFirstNineVisitForProfile(
  profileId: string | undefined,
  visitScore: number,
) {
  if (!isAccountProfileId(profileId)) {
    return;
  }

  mutateAccountStats((stats) => applyFirstNineVisit(stats, visitScore));
}

export function recordLegResultForProfile(profileId: string | undefined, won: boolean) {
  if (isAccountProfileId(profileId)) {
    mutateAccountStats((stats) => applyLegResult(stats, won));
    return;
  }

  if (isCloudProfileId(profileId)) {
    mutateSavedPlayerStats(profileId, (stats) => applyLegResult(stats, won));
  }
}

export function recordCheckoutForProfile(profileId: string | undefined, success: boolean) {
  if (isAccountProfileId(profileId)) {
    mutateAccountStats((stats) => applyCheckoutAttempt(stats, success));
    return;
  }

  if (isCloudProfileId(profileId)) {
    mutateSavedPlayerStats(profileId, (stats) => applyCheckoutAttempt(stats, success));
  }
}

export function recordMatchResultForProfile(profileId: string | undefined, won: boolean) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.setState((state) => ({
      stats: applyMatchResult(state.stats, won),
    }));
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.setState((state) => ({
      byProfileId: {
        ...state.byProfileId,
        [profileId]: applyMatchResult(
          state.byProfileId[profileId] ?? useStatisticsStore.getState().stats,
          won,
        ),
      },
    }));
  }
}
