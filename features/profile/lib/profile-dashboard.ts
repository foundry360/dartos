import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { SkillLevel } from "@/types/profile";
import {
  getCheckoutPercentage,
  getHitPercentage,
  getLegWinPercentage,
  getThreeDartAverage,
  getWinPercentage,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";

export function formatProfileRank(skillLevel: SkillLevel | null | undefined) {
  switch (skillLevel) {
    case "pro":
      return "Elite · Division I";
    case "advanced":
      return "Advanced · Division II";
    case "intermediate":
      return "Intermediate · Division III";
    case "beginner":
      return "Rookie · Division IV";
    default:
      return null;
  }
}

export function formatProfileNickname(nickname: string | null | undefined) {
  if (!nickname?.trim()) {
    return null;
  }

  const trimmed = nickname.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function getRecentFormRowCapacity(
  widthPx: number,
  chipSizePx = 32,
  gapPx = 8,
) {
  if (widthPx <= 0) {
    return 6;
  }

  return Math.max(1, Math.floor((widthPx + gapPx) / (chipSizePx + gapPx)));
}

export function getRecentMatchForm(matches: MatchHistoryEntry[], count = 6) {
  return matches.slice(0, count).map((match) => match.userWon);
}

export function buildAverageTrendData(scores: number[]) {
  const points = scores.slice(-10);

  return points.map((average, index) => ({
    label: `M${index + 1}`,
    average,
  }));
}

export function computeDartsIq(stats: SessionStats) {
  const scoring = Math.min(getThreeDartAverage(stats) / 100, 1) * 100;
  const checkout = getCheckoutPercentage(stats);
  const legWin = getLegWinPercentage(stats);
  const totalHits =
    stats.singlesHit + stats.doublesHit + stats.triplesHit + stats.bullHit;
  const accuracy = getHitPercentage(totalHits, stats.dartsThrown);

  const components = [scoring, checkout, legWin, accuracy].filter((value) => value > 0);

  if (components.length === 0) {
    return 0;
  }

  const composite = components.reduce((sum, value) => sum + value, 0) / components.length;

  return Math.round(80 + composite * 0.65);
}

export function averageToGaugePercent(average: number, max = 100) {
  if (average <= 0) {
    return 0;
  }

  return Math.min((average / max) * 100, 100);
}

export function iqToGaugePercent(iq: number, max = 160) {
  if (iq <= 0) {
    return 0;
  }

  return Math.min((iq / max) * 100, 100);
}

export function formatWinRate(value: number) {
  if (value <= 0) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

export function getQuickStats(stats: SessionStats) {
  return {
    played: stats.matchesPlayed,
    won: stats.matchesWon,
    winRate: getWinPercentage(stats),
  };
}
