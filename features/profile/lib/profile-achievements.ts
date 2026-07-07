import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { ProfileAchievement } from "@/types/profile";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

function getMatchWinStreak(matches: MatchHistoryEntry[]) {
  let streak = 0;

  for (const match of matches) {
    if (!match.userWon) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function hasCricketWin(matches: MatchHistoryEntry[]) {
  return matches.some(
    (match) => match.userWon && match.matchType.toLowerCase().includes("cricket"),
  );
}

export function buildProfileAchievements(
  stats: SessionStats,
  matches: MatchHistoryEntry[],
): ProfileAchievement[] {
  const winStreak = getMatchWinStreak(matches);

  return [
    {
      id: "first-180",
      icon: "trophy",
      title: "First 180",
      description: "Hit your first maximum score",
      unlocked: stats.visits180Plus > 0 || stats.highestVisit >= 180,
    },
    {
      id: "100-checkout-club",
      icon: "target",
      title: "100 Checkout Club",
      description: "Finish a checkout of 100 or more",
      unlocked: stats.highestCheckout >= 100,
    },
    {
      id: "win-streak-10",
      icon: "flame",
      title: "10 Match Win Streak",
      description: "Win 10 matches in a row",
      unlocked: winStreak >= 10,
    },
    {
      id: "cricket-master",
      icon: "cricket",
      title: "Cricket Master",
      description: "Win a Cricket match",
      unlocked: hasCricketWin(matches),
    },
    {
      id: "bull-hunter",
      icon: "bull",
      title: "Bull Hunter",
      description: "Land 100 bullseyes",
      unlocked: stats.bullHit >= 100,
    },
  ];
}
