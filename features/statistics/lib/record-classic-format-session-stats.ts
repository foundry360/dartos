import type { DartHit } from "@/types/dart";
import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { recordHeadToHeadForFinishedMatch } from "@/features/match-play/lib/record-head-to-head";
import { recordDartForPlayerProfile } from "@/features/statistics/lib/record-player-session-stats";
import { commitPendingMatchStatsToOfficial } from "@/features/statistics/store/pending-match-stats-store";
import {
  recordMatchResultForProfile,
  recordVisitScoreForProfile,
} from "@/features/statistics/lib/profile-session-stat-recording";

interface ClassicFormatPlayer {
  id: string;
  name: string;
  nickname?: string | null;
  profileId?: string;
  playerKind?: "human" | "bot";
  score?: number;
}

interface ClassicFormatTurnSnapshot {
  players: ClassicFormatPlayer[];
  currentPlayerIndex: number;
  visitDarts: DartHit[];
  isBotMatch?: boolean;
  status: "playing" | "finished";
  winnerId?: string;
}

export function recordClassicFormatDartForPlayer(
  player: ClassicFormatPlayer | undefined,
  hit: DartHit,
) {
  if (!player || player.playerKind === "bot") {
    return;
  }

  recordDartForPlayerProfile(player.profileId, hit);
}

export function recordClassicFormatTurnFinished(input: {
  before: ClassicFormatTurnSnapshot;
  after: ClassicFormatTurnSnapshot;
  matchType: string;
}) {
  const { before, after, matchType } = input;

  if (!after.isBotMatch) {
    return;
  }

  const completedPlayer = before.players[before.currentPlayerIndex];

  if (completedPlayer && completedPlayer.playerKind !== "bot") {
    const visitScore = before.visitDarts.reduce((total, dart) => total + dart.score, 0);
    recordVisitScoreForProfile(completedPlayer.profileId, visitScore);
  }

  if (after.status !== "finished" || !after.winnerId) {
    return;
  }

  const winner = after.players.find((player) => player.id === after.winnerId);

  if (!winner) {
    return;
  }

  const accountPlayer = after.players.find((player) => isAccountProfileId(player.profileId));

  if (!accountPlayer) {
    return;
  }

  commitPendingMatchStatsToOfficial();

  for (const player of after.players) {
    recordMatchResultForProfile(player.profileId, player.id === winner.id);
  }

  recordHeadToHeadForFinishedMatch({
    players: after.players,
    winnerId: winner.id,
    winnerProfileId: winner.profileId,
    teamsEnabled: false,
    matchType,
  });
}
