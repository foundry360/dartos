import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";

export interface HomeRecentMatchPreview {
  match: MatchHistoryEntry;
  opponentNickname: string;
}

const dayMs = 24 * 60 * 60 * 1000;

export const HOME_SAMPLE_RECENT_MATCHES: HomeRecentMatchPreview[] = [
  {
    match: {
      id: "sample-match-mike",
      opponentId: "sample-opponent-mike",
      userWon: true,
      matchType: "501",
      userLegs: 3,
      opponentLegs: 2,
      playedAt: new Date(Date.now() - dayMs).toISOString(),
    },
    opponentNickname: "Mike",
  },
  {
    match: {
      id: "sample-match-sarah",
      opponentId: "sample-opponent-sarah",
      userWon: false,
      matchType: "Cricket",
      userLegs: 1,
      opponentLegs: 3,
      playedAt: new Date(Date.now() - dayMs * 3).toISOString(),
    },
    opponentNickname: "Sarah",
  },
  {
    match: {
      id: "sample-match-alex",
      opponentId: "sample-opponent-alex",
      userWon: true,
      matchType: "301",
      userLegs: 2,
      opponentLegs: 0,
      playedAt: new Date(Date.now() - dayMs * 7).toISOString(),
    },
    opponentNickname: "Alex",
  },
];

export function getHomeRecentMatchesPreview(
  matches: HomeRecentMatchPreview[],
  options?: { allowSampleData?: boolean },
): HomeRecentMatchPreview[] {
  if (matches.length > 0) {
    return matches;
  }

  if (options?.allowSampleData && process.env.NODE_ENV === "development") {
    return HOME_SAMPLE_RECENT_MATCHES;
  }

  return [];
}
