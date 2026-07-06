import type { DartHit } from "@/types/dart";
import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";

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

function playerWonLeg(player: CricketPlayerState, legWinner: CricketPlayerState, teamsEnabled: boolean) {
  if (!teamsEnabled) {
    return player.id === legWinner.id;
  }

  return player.teamId === legWinner.teamId;
}

function playerWonMatch(
  player: CricketPlayerState,
  winner: CricketPlayerState,
  teamsEnabled: boolean,
) {
  if (!teamsEnabled) {
    return player.id === winner.id;
  }

  return player.teamId === winner.teamId;
}

export function recordCricketDartForSavedPlayer(player: CricketPlayerState, hit: DartHit) {
  if (!isCloudProfileId(player.profileId)) {
    return;
  }

  const store = useSavedPlayerStatsStore.getState();
  const segment = dartHitSegment(hit);

  if (segment) {
    store.recordDartHit(player.profileId, segment);
    return;
  }

  store.recordDartMiss(player.profileId);
}

export function recordCricketTurnForSavedPlayers(input: {
  before: CricketGameState;
  after: CricketGameState;
  currentPlayer: CricketPlayerState | undefined;
  visitScore: number;
  legWinner: CricketPlayerState | undefined;
}) {
  const { before, after, currentPlayer, visitScore, legWinner } = input;
  const store = useSavedPlayerStatsStore.getState();

  if (currentPlayer && isCloudProfileId(currentPlayer.profileId)) {
    store.recordVisitScore(currentPlayer.profileId, visitScore);
  }

  if (legWinner && after.legsPlayed > before.legsPlayed) {
    for (const player of before.players) {
      if (!isCloudProfileId(player.profileId)) {
        continue;
      }

      store.recordLegResult(
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
      if (!isCloudProfileId(player.profileId)) {
        continue;
      }

      store.recordMatchResult(
        player.profileId,
        playerWonMatch(player, winner, after.teamsEnabled),
      );
    }
  }
}
