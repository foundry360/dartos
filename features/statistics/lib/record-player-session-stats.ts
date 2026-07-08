import type { DartHit } from "@/types/dart";
import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import type { X01GameState, X01PlayerState } from "@/types/x01";
import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { formatCricketVariantLabel } from "@/lib/constants";
import { recordHeadToHeadForFinishedMatch } from "@/features/match-play/lib/record-head-to-head";
import {
  recordCheckoutForProfile,
  recordDartHitForProfile,
  recordDartMissForProfile,
  recordFirstNineVisitForProfile,
  recordLegResultForProfile,
  recordMatchResultForProfile,
  recordVisitScoreForProfile,
} from "@/features/statistics/lib/profile-session-stat-recording";
import { commitPendingMatchStatsToOfficial } from "@/features/statistics/store/pending-match-stats-store";

function dartHitSegment(hit: DartHit): "single" | "double" | "triple" | "bull" | null {
  if (hit.segment === "miss") {
    return null;
  }

  if (hit.segment === "bull") {
    return "bull";
  }

  if (hit.multiplier === "triple") {
    return "triple";
  }

  if (hit.multiplier === "double") {
    return "double";
  }

  return "single";
}

export function recordDartForPlayerProfile(
  profileId: string | undefined,
  hit: DartHit,
) {
  const segment = dartHitSegment(hit);

  if (segment) {
    recordDartHitForProfile(profileId, segment);
    return;
  }

  recordDartMissForProfile(profileId);
}

function recordFinishedMatchStats() {
  commitPendingMatchStatsToOfficial();
}

function recordFinishedMatchHeadToHead(input: {
  players: Array<{
    id: string;
    name: string;
    nickname?: string | null;
    profileId?: string;
    legsWon?: number;
  }>;
  winner: {
    id: string;
    profileId?: string;
  };
  teamsEnabled: boolean;
  matchType: string;
}) {
  recordHeadToHeadForFinishedMatch({
    players: input.players,
    winnerId: input.winner.id,
    winnerProfileId: input.winner.profileId,
    teamsEnabled: input.teamsEnabled,
    matchType: input.matchType,
  });
}

function playerWonLeg(
  player: CricketPlayerState | X01PlayerState,
  legWinner: CricketPlayerState | X01PlayerState,
  teamsEnabled: boolean,
) {
  if (!teamsEnabled) {
    return player.id === legWinner.id;
  }

  return player.teamId === legWinner.teamId;
}

function playerWonMatch(
  player: CricketPlayerState | X01PlayerState,
  winner: CricketPlayerState | X01PlayerState,
  teamsEnabled: boolean,
) {
  if (!teamsEnabled) {
    return player.id === winner.id;
  }

  return player.teamId === winner.teamId;
}

function resolveX01LegWinner(
  before: X01GameState,
  after: X01GameState,
): X01PlayerState | undefined {
  const playerIndex = before.currentPlayerIndex;
  const beforePlayer = before.players[playerIndex];
  const afterPlayer = after.players[playerIndex];

  if (!beforePlayer || !afterPlayer || afterPlayer.legsWon <= beforePlayer.legsWon) {
    return undefined;
  }

  return beforePlayer;
}

export function recordCricketDartForPlayer(player: CricketPlayerState, hit: DartHit) {
  recordDartForPlayerProfile(player.profileId, hit);
}

export function recordCricketTurnForPlayers(input: {
  before: CricketGameState;
  after: CricketGameState;
  currentPlayer: CricketPlayerState | undefined;
  visitScore: number;
  legWinner: CricketPlayerState | undefined;
}) {
  const { before, after, currentPlayer, visitScore, legWinner } = input;

  if (currentPlayer) {
    recordVisitScoreForProfile(currentPlayer.profileId, visitScore);
  }

  if (legWinner && after.legsPlayed > before.legsPlayed) {
    for (const player of before.players) {
      recordLegResultForProfile(
        player.profileId,
        playerWonLeg(player, legWinner, before.teamsEnabled),
      );
    }
  }

  if (after.status === "finished" && after.winnerId) {
    const winner = after.players.find((player) => player.id === after.winnerId);

    if (!winner) {
      return;
    }

    recordFinishedMatchStats();

    for (const player of after.players) {
      recordMatchResultForProfile(
        player.profileId,
        playerWonMatch(player, winner, after.teamsEnabled),
      );
    }

    recordFinishedMatchHeadToHead({
      players: after.players,
      winner,
      teamsEnabled: after.teamsEnabled,
      matchType: formatCricketVariantLabel(after.variant),
    });
  }
}

export function recordX01DartForPlayer(player: X01PlayerState, hit: DartHit) {
  recordDartForPlayerProfile(player.profileId, hit);
}

export function recordX01VisitCompleted(
  currentPlayer: X01PlayerState | undefined,
  visitScore: number,
) {
  if (!currentPlayer || visitScore <= 0) {
    return;
  }

  recordVisitScoreForProfile(currentPlayer.profileId, visitScore);

  if (isAccountProfileId(currentPlayer.profileId)) {
    recordFirstNineVisitForProfile(currentPlayer.profileId, visitScore);
  }
}

export function recordX01GameProgress(input: {
  before: X01GameState;
  after: X01GameState;
  legWinner: X01PlayerState | undefined;
}) {
  const { before, after, legWinner } = input;

  if (legWinner) {
    recordCheckoutForProfile(legWinner.profileId, true, before.visitStartRemaining);

    for (const player of before.players) {
      recordLegResultForProfile(
        player.profileId,
        playerWonLeg(player, legWinner, before.teamsEnabled),
      );
    }
  }

  if (after.status === "finished" && after.winnerId) {
    const winner = after.players.find((player) => player.id === after.winnerId);

    if (!winner) {
      return;
    }

    recordFinishedMatchStats();

    for (const player of after.players) {
      recordMatchResultForProfile(
        player.profileId,
        playerWonMatch(player, winner, after.teamsEnabled),
      );
    }

    recordFinishedMatchHeadToHead({
      players: after.players,
      winner,
      teamsEnabled: after.teamsEnabled,
      matchType: String(after.gameType),
    });
  }
}

export function recordX01TurnForPlayers(input: {
  before: X01GameState;
  after: X01GameState;
  currentPlayer: X01PlayerState | undefined;
  visitScore: number;
}) {
  const { before, after, currentPlayer, visitScore } = input;
  const legWinner = resolveX01LegWinner(before, after);

  if (legWinner || after.status === "finished") {
    recordX01VisitCompleted(currentPlayer, visitScore);
  }

  recordX01GameProgress({ before, after, legWinner });
}
