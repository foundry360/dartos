import type { ProfileCareerSnapshot } from "@/types/profile";
import {
  getCheckoutPercentage,
  getFirstFifteenAverage,
  getFirstNineAverage,
  getFirstTwelveAverage,
  getThreeDartAverage,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";
import { formatProfileAverage } from "@/features/profile/lib/profile-stats";

export function buildProfileCareerSnapshot(stats: SessionStats): ProfileCareerSnapshot {
  const losses = Math.max(stats.matchesPlayed - stats.matchesWon, 0);

  return {
    threeDartAverage: getThreeDartAverage(stats),
    firstNineAverage: getFirstNineAverage(stats),
    firstTwelveAverage: getFirstTwelveAverage(stats),
    firstFifteenAverage: getFirstFifteenAverage(stats),
    checkoutPercent: getCheckoutPercentage(stats),
    highFinish: stats.highestCheckout,
    avgFinish: 0,
    bestGame: stats.highestVisit,
    topRecord: {
      wins: stats.matchesWon,
      losses,
    },
  };
}

export function formatSnapshotAverage(value: number) {
  return formatProfileAverage(value);
}

export function formatSnapshotPercent(value: number) {
  if (value <= 0) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

export function formatSnapshotCount(value: number) {
  if (value <= 0) {
    return "—";
  }

  return value.toLocaleString();
}

export function formatTopRecord(record: ProfileCareerSnapshot["topRecord"]) {
  if (record.wins <= 0 && record.losses <= 0) {
    return "—";
  }

  return `${record.wins}-${record.losses}`;
}

export function profileCareerSnapshotHasData(stats: SessionStats) {
  const snapshot = buildProfileCareerSnapshot(stats);

  return (
    stats.visits > 0 ||
    stats.checkoutAttempts > 0 ||
    stats.matchesPlayed > 0 ||
    snapshot.highFinish > 0 ||
    snapshot.bestGame > 0
  );
}
