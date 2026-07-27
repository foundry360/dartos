import { formatCricketVariantLabel } from "@/lib/constants";
import { getAccountProfileId } from "@/features/players/lib/account-player-profile";
import { recordHeadToHeadForFinishedMatch } from "@/features/match-play/lib/record-head-to-head";
import { rebuildPendingMatchStatsForProfile } from "@/features/statistics/lib/rebuild-pending-match-stats";
import { recordMatchResultForProfile } from "@/features/statistics/lib/profile-session-stat-recording";
import { commitPendingMatchStatsToOfficial } from "@/features/statistics/store/pending-match-stats-store";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";

export function isCommunityEngineMatch(matchId: string | null | undefined): boolean {
  return typeof matchId === "string" && matchId.startsWith("community:");
}

function communityMatchTypeLabel(game: X01GameState | CricketGameState): string {
  if ("gameType" in game) {
    return `Community ${game.gameType}`;
  }

  return `Community ${formatCricketVariantLabel(game.variant)}`;
}

export function getCommunityFinishStatsKey(
  game: X01GameState | CricketGameState,
): string | null {
  if (game.status !== "finished" || !game.winnerId || !game.matchId) {
    return null;
  }

  const legs = game.players.map((player) => player.legsWon).join("-");
  return `${game.matchId}:${game.winnerId}:${game.legsPlayed}:${legs}`;
}

/** Session-scoped dedupe (survives Strict Mode remounts; cleared on rematch via new key). */
const recordedCommunityFinishKeys = new Set<string>();

/**
 * Commit this viewer's session stats + match history for a finished community match.
 * Safe to call from both clients; idempotent per viewer + finish key for the page session.
 */
export function recordCommunityFinishedMatch(input: {
  game: X01GameState | CricketGameState;
  viewerUserId: string;
}): string | null {
  const { game, viewerUserId } = input;
  const key = getCommunityFinishStatsKey(game);

  if (!key || !isCommunityEngineMatch(game.matchId)) {
    return null;
  }

  const dedupeKey = `${viewerUserId}:${key}`;
  if (recordedCommunityFinishKeys.has(dedupeKey)) {
    return key;
  }

  const accountProfileId = getAccountProfileId(viewerUserId);
  const accountPlayer = game.players.find(
    (player) => player.profileId === accountProfileId,
  );

  if (!accountPlayer) {
    return null;
  }

  const winner = game.players.find((player) => player.id === game.winnerId);
  if (!winner) {
    return null;
  }

  rebuildPendingMatchStatsForProfile(game, accountProfileId);
  commitPendingMatchStatsToOfficial();

  const userWon =
    winner.profileId === accountProfileId || winner.id === accountPlayer.id;
  recordMatchResultForProfile(accountProfileId, userWon);

  recordHeadToHeadForFinishedMatch({
    players: game.players,
    winnerId: winner.id,
    winnerProfileId: winner.profileId,
    teamsEnabled: game.teamsEnabled,
    matchType: communityMatchTypeLabel(game),
    viewerProfileId: accountProfileId,
  });

  recordedCommunityFinishKeys.add(dedupeKey);
  return key;
}
