import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { useHeadToHeadStore } from "@/features/match-play/store/head-to-head-store";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";

interface HeadToHeadPlayer {
  profileId?: string;
  legsWon?: number;
}

export function recordHeadToHeadForFinishedMatch(input: {
  players: HeadToHeadPlayer[];
  winnerProfileId: string | undefined;
  teamsEnabled: boolean;
  matchType: string;
}) {
  const { players, winnerProfileId, teamsEnabled, matchType } = input;

  if (teamsEnabled || !winnerProfileId) {
    return;
  }

  const profileIds = players
    .map((player) => player.profileId)
    .filter((profileId): profileId is string => Boolean(profileId));

  if (profileIds.length !== 2) {
    return;
  }

  const accountProfileId = profileIds.find(isAccountProfileId);
  const opponentId = profileIds.find((profileId) => isCloudProfileId(profileId));

  if (!accountProfileId || !opponentId) {
    return;
  }

  const userWon = winnerProfileId === accountProfileId;
  const accountPlayer = players.find((player) => player.profileId === accountProfileId);
  const opponentPlayer = players.find((player) => player.profileId === opponentId);
  const userLegs = accountPlayer?.legsWon ?? 0;
  const opponentLegs = opponentPlayer?.legsWon ?? 0;

  useHeadToHeadStore.getState().recordMatch(opponentId, userWon);
  useMatchHistoryStore.getState().addMatch({
    opponentId,
    userWon,
    matchType,
    userLegs,
    opponentLegs,
  });
}
