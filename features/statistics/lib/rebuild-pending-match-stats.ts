import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";
import {
  recordCheckoutForProfile,
  recordFirstNineVisitForProfile,
  recordLegResultForProfile,
  recordVisitScoreForProfile,
} from "@/features/statistics/lib/profile-session-stat-recording";
import { recordDartForPlayerProfile } from "@/features/statistics/lib/record-player-session-stats";
import {
  discardPendingMatchStats,
  runWithForcedPendingMatchStats,
} from "@/features/statistics/store/pending-match-stats-store";

function rebuildPendingStatsFromX01Game(
  game: X01GameState,
  onlyProfileId?: string,
) {
  for (const entry of game.history) {
    const player = game.players[entry.playerIndex];

    if (!player?.profileId) {
      continue;
    }

    if (onlyProfileId && player.profileId !== onlyProfileId) {
      continue;
    }

    recordDartForPlayerProfile(player.profileId, entry.dart);
  }

  for (const player of game.players) {
    if (!player.profileId) {
      continue;
    }

    if (onlyProfileId && player.profileId !== onlyProfileId) {
      continue;
    }

    for (const visitScore of player.visitScores) {
      if (visitScore <= 0) {
        continue;
      }

      recordVisitScoreForProfile(player.profileId, visitScore);
      recordFirstNineVisitForProfile(player.profileId, visitScore);
    }

    for (let index = 0; index < player.checkoutSuccesses; index += 1) {
      recordCheckoutForProfile(player.profileId, true);
    }

    const legsLost = Math.max(0, game.legsPlayed - player.legsWon);

    for (let index = 0; index < player.legsWon; index += 1) {
      recordLegResultForProfile(player.profileId, true);
    }

    for (let index = 0; index < legsLost; index += 1) {
      recordLegResultForProfile(player.profileId, false);
    }
  }
}

function rebuildPendingStatsFromCricketGame(
  game: CricketGameState,
  onlyProfileId?: string,
) {
  for (const entry of game.history) {
    const player = game.players[entry.playerIndex];

    if (!player?.profileId) {
      continue;
    }

    if (onlyProfileId && player.profileId !== onlyProfileId) {
      continue;
    }

    recordDartForPlayerProfile(player.profileId, entry.dart);
  }

  for (const player of game.players) {
    if (!player.profileId) {
      continue;
    }

    if (onlyProfileId && player.profileId !== onlyProfileId) {
      continue;
    }

    const legsLost = Math.max(0, game.legsPlayed - player.legsWon);

    for (let index = 0; index < player.legsWon; index += 1) {
      recordLegResultForProfile(player.profileId, true);
    }

    for (let index = 0; index < legsLost; index += 1) {
      recordLegResultForProfile(player.profileId, false);
    }
  }
}

export function rebuildPendingMatchStatsFromGame(game: X01GameState | CricketGameState) {
  if (game.status !== "playing") {
    discardPendingMatchStats();
    return;
  }

  discardPendingMatchStats();

  if ("gameType" in game) {
    rebuildPendingStatsFromX01Game(game);
    return;
  }

  rebuildPendingStatsFromCricketGame(game);
}

/** Rebuild pending stats for one profile from a playing or finished game (community finish). */
export function rebuildPendingMatchStatsForProfile(
  game: X01GameState | CricketGameState,
  profileId: string,
) {
  if (game.status !== "playing" && game.status !== "finished") {
    discardPendingMatchStats();
    return;
  }

  discardPendingMatchStats();

  runWithForcedPendingMatchStats(() => {
    if ("gameType" in game) {
      rebuildPendingStatsFromX01Game(game, profileId);
      return;
    }

    rebuildPendingStatsFromCricketGame(game, profileId);
  });
}
