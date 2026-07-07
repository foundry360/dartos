import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { getAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { useX01Store } from "@/features/x01/store/x01-store";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";

export type ActiveMatchGameMode = "x01" | "cricket";

export interface ActiveMatchSummary {
  href: string;
  userName: string;
  opponentName: string;
  opponentProfileId?: string;
  opponentAvatarUrl?: string | null;
  opponentColor?: string | null;
  matchType: string;
  progress: string;
}

export interface ActiveMatchSnapshot {
  gameMode: ActiveMatchGameMode;
  resumeHref: string;
  matchType: string;
  opponentId: string | null;
  opponentName: string;
  progress: string;
  gameState: X01GameState | CricketGameState;
}

interface ActiveMatchPlayer {
  name: string;
  nickname?: string | null;
  profileId?: string;
  avatarUrl?: string | null;
  color?: string;
}

function summarizeAccountPlayers(players: ActiveMatchPlayer[], accountProfileId: string) {
  const accountPlayer = players.find((player) => player.profileId === accountProfileId);

  if (!accountPlayer) {
    return null;
  }

  const opponents = players.filter((player) => player.profileId !== accountProfileId);
  const primaryOpponent = opponents[0];
  const opponentName =
    opponents.length === 1
      ? getPlayerScorecardName(opponents[0]!)
      : opponents.length > 1
        ? opponents.map((player) => getPlayerScorecardName(player)).join(", ")
        : "Opponent";

  return {
    userName: getPlayerScorecardName(accountPlayer),
    opponentName,
    opponentProfileId: primaryOpponent?.profileId,
    opponentAvatarUrl: primaryOpponent?.avatarUrl,
    opponentColor: primaryOpponent?.color ?? null,
  };
}

function summarizeOpponent(players: ActiveMatchPlayer[], accountProfileId: string) {
  const opponents = players.filter((player) => player.profileId !== accountProfileId);
  const primaryOpponent = opponents[0];
  const opponentName =
    opponents.length === 1
      ? getPlayerScorecardName(opponents[0]!)
      : opponents.length > 1
        ? opponents.map((player) => getPlayerScorecardName(player)).join(", ")
        : "Opponent";
  const opponentId =
    primaryOpponent?.profileId && isCloudProfileId(primaryOpponent.profileId)
      ? primaryOpponent.profileId
      : null;

  return { opponentName, opponentId };
}

function buildCricketSnapshot(
  game: CricketGameState,
  accountProfileId: string,
): ActiveMatchSnapshot {
  const { opponentName, opponentId } = summarizeOpponent(game.players, accountProfileId);

  return {
    gameMode: "cricket",
    resumeHref: "/cricket/play",
    matchType: formatCricketVariantLabel(game.variant ?? "classic"),
    opponentId,
    opponentName,
    progress: formatCricketMatchProgress(game.players),
    gameState: game,
  };
}

function buildX01Snapshot(game: X01GameState, accountProfileId: string): ActiveMatchSnapshot {
  const { opponentName, opponentId } = summarizeOpponent(game.players, accountProfileId);

  return {
    gameMode: "x01",
    resumeHref: `/x01/${game.gameType}/play`,
    matchType: String(game.gameType),
    opponentId,
    opponentName,
    progress: formatCricketMatchProgress(game.players),
    gameState: game,
  };
}

export function getActiveMatchSnapshot(userId: string | undefined): ActiveMatchSnapshot | null {
  if (!userId) {
    return null;
  }

  const accountProfileId = getAccountProfileId(userId);
  const cricketGame = useCricketStore.getState().game;

  if (cricketGame?.status === "playing") {
    const accountPlayer = cricketGame.players.find(
      (player) => player.profileId === accountProfileId,
    );

    if (accountPlayer) {
      return buildCricketSnapshot(cricketGame, accountProfileId);
    }
  }

  const x01Game = useX01Store.getState().game;

  if (x01Game?.status === "playing") {
    const accountPlayer = x01Game.players.find((player) => player.profileId === accountProfileId);

    if (accountPlayer) {
      return buildX01Snapshot(x01Game, accountProfileId);
    }
  }

  return null;
}

export function buildActiveMatchSummaryFromSnapshot(
  snapshot: ActiveMatchSnapshot,
  userId: string,
  accountDisplayName?: string | null,
): ActiveMatchSummary | null {
  const accountProfileId = getAccountProfileId(userId);
  const game = snapshot.gameState;

  if (game.status === "playing") {
    const summary = summarizeAccountPlayers(game.players, accountProfileId);

    if (summary) {
      return {
        href: snapshot.resumeHref,
        userName: summary.userName,
        opponentName: summary.opponentName,
        opponentProfileId: summary.opponentProfileId,
        opponentAvatarUrl: summary.opponentAvatarUrl,
        opponentColor: summary.opponentColor,
        matchType: snapshot.matchType,
        progress: snapshot.progress,
      };
    }
  }

  return {
    href: snapshot.resumeHref,
    userName: accountDisplayName?.trim() || "You",
    opponentName: snapshot.opponentName,
    opponentProfileId: snapshot.opponentId ?? undefined,
    matchType: snapshot.matchType,
    progress: snapshot.progress,
  };
}

export function restoreActiveMatchSnapshot(snapshot: ActiveMatchSnapshot) {
  if (snapshot.gameMode === "cricket") {
    useX01Store.getState().reset();
    useCricketStore.getState().restoreGame(snapshot.gameState as CricketGameState);
    return;
  }

  useCricketStore.getState().reset();
  useX01Store.getState().restoreGame(snapshot.gameState as X01GameState);
}
