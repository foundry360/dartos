import { getPlayerScorecardName } from "@/lib/player-display";
import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { useHeadToHeadStore } from "@/features/match-play/store/head-to-head-store";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";

interface HeadToHeadPlayer {
  id?: string;
  name: string;
  nickname?: string | null;
  profileId?: string;
  legsWon?: number;
}

export function recordHeadToHeadForFinishedMatch(input: {
  players: HeadToHeadPlayer[];
  winnerProfileId?: string;
  winnerId?: string;
  teamsEnabled: boolean;
  matchType: string;
}) {
  const { players, winnerProfileId, winnerId, teamsEnabled, matchType } = input;

  if (teamsEnabled || players.length !== 2) {
    return;
  }

  const accountPlayer = players.find((player) => isAccountProfileId(player.profileId));

  if (!accountPlayer?.profileId) {
    return;
  }

  const opponentPlayer = players.find((player) => player.id !== accountPlayer.id);

  if (!opponentPlayer) {
    return;
  }

  const winner = players.find(
    (player) =>
      (winnerProfileId && player.profileId === winnerProfileId) ||
      (winnerId && player.id === winnerId),
  );

  if (!winner) {
    return;
  }

  const userWon =
    winner.profileId === accountPlayer.profileId ||
    (winner.id != null && winner.id === accountPlayer.id);

  const opponentName = getPlayerScorecardName(opponentPlayer);
  const opponentId = isCloudProfileId(opponentPlayer.profileId)
    ? opponentPlayer.profileId!
    : null;

  if (opponentId) {
    useHeadToHeadStore.getState().recordMatch(opponentId, userWon);
  }

  useMatchHistoryStore.getState().addMatch({
    opponentId,
    opponentName,
    userWon,
    matchType,
    userLegs: accountPlayer.legsWon ?? 0,
    opponentLegs: opponentPlayer.legsWon ?? 0,
  });
}
