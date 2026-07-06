import type { DartHit } from "@/types/dart";
import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import type { X01GameState, X01PlayerState } from "@/types/x01";
import { isAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { formatCricketVariantLabel } from "@/lib/constants";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";
import { recordHeadToHeadForFinishedMatch } from "@/features/match-play/lib/record-head-to-head";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";

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

function recordDartHitForProfile(profileId: string | undefined, segment: "single" | "double" | "triple" | "bull") {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordDartHit(segment);
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordDartHit(profileId, segment);
  }
}

function recordDartMissForProfile(profileId: string | undefined) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordDartMiss();
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordDartMiss(profileId);
  }
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

function recordVisitScoreForProfile(profileId: string | undefined, visitScore: number) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordVisitScore(visitScore);
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordVisitScore(profileId, visitScore);
  }
}

function recordLegResultForProfile(profileId: string | undefined, won: boolean) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordLegResult(won);
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordLegResult(profileId, won);
  }
}

function recordMatchResultForProfile(profileId: string | undefined, won: boolean) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordMatchResult(won);
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordMatchResult(profileId, won);
  }
}

function recordCheckoutForProfile(profileId: string | undefined, success: boolean) {
  if (isAccountProfileId(profileId)) {
    useStatisticsStore.getState().recordCheckoutAttempt(success);
    return;
  }

  if (isCloudProfileId(profileId)) {
    useSavedPlayerStatsStore.getState().recordCheckoutAttempt(profileId, success);
  }
}

function recordFinishedMatchHeadToHead(input: {
  players: Array<{ profileId?: string }>;
  winnerProfileId: string | undefined;
  teamsEnabled: boolean;
  matchType: string;
}) {
  recordHeadToHeadForFinishedMatch(input);
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

    for (const player of after.players) {
      recordMatchResultForProfile(
        player.profileId,
        playerWonMatch(player, winner, after.teamsEnabled),
      );
    }

    recordFinishedMatchHeadToHead({
      players: after.players,
      winnerProfileId: winner.profileId,
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
    useStatisticsStore.getState().recordFirstNineVisit(visitScore);
  }
}

export function recordX01GameProgress(input: {
  before: X01GameState;
  after: X01GameState;
  legWinner: X01PlayerState | undefined;
}) {
  const { before, after, legWinner } = input;

  if (legWinner && after.legsPlayed > before.legsPlayed) {
    recordCheckoutForProfile(legWinner.profileId, true);

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

    for (const player of after.players) {
      recordMatchResultForProfile(
        player.profileId,
        playerWonMatch(player, winner, after.teamsEnabled),
      );
    }

    recordFinishedMatchHeadToHead({
      players: after.players,
      winnerProfileId: winner.profileId,
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
  const legWinner =
    after.legsPlayed > before.legsPlayed
      ? before.players[before.currentPlayerIndex]
      : undefined;

  if (after.legsPlayed > before.legsPlayed || after.status === "finished") {
    recordX01VisitCompleted(currentPlayer, visitScore);
  }

  recordX01GameProgress({ before, after, legWinner });
}
