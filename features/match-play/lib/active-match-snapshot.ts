import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { buildActiveMatchResumeHref, createMatchId } from "@/features/match-play/lib/match-id";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { getAccountProfileId } from "@/features/players/lib/account-player-profile";
import { isCloudProfileId } from "@/features/players/lib/is-cloud-profile";
import { rebuildPendingMatchStatsFromGame } from "@/features/statistics/lib/rebuild-pending-match-stats";
import { useX01Store } from "@/features/x01/store/x01-store";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";

export type ActiveMatchGameMode = "x01" | "cricket";

export interface ActiveMatchSummary {
  id: string;
  href: string;
  userName: string;
  opponentName: string;
  opponentProfileId?: string;
  opponentAvatarUrl?: string | null;
  opponentColor?: string | null;
  matchType: string;
  progress: string;
  updatedAt: string;
}

export interface ActiveMatchSnapshot {
  id: string;
  gameMode: ActiveMatchGameMode;
  resumeHref: string;
  matchType: string;
  opponentId: string | null;
  opponentName: string;
  progress: string;
  updatedAt: string;
  gameState: X01GameState | CricketGameState;
}

interface StoredActiveMatchEnvelope {
  version: 1;
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

function resolveSnapshotMatchId(game: X01GameState | CricketGameState): string {
  return game.matchId ?? createMatchId();
}

function buildCricketSnapshot(
  game: CricketGameState,
  accountProfileId: string,
  updatedAt = new Date().toISOString(),
): ActiveMatchSnapshot {
  const { opponentName, opponentId } = summarizeOpponent(game.players, accountProfileId);
  const matchId = resolveSnapshotMatchId(game);

  return {
    id: matchId,
    gameMode: "cricket",
    resumeHref: buildActiveMatchResumeHref("cricket", matchId),
    matchType: formatCricketVariantLabel(game.variant ?? "classic"),
    opponentId,
    opponentName,
    progress: formatCricketMatchProgress(game.players),
    updatedAt,
    gameState: {
      ...game,
      matchId,
    },
  };
}

function buildX01Snapshot(
  game: X01GameState,
  accountProfileId: string,
  updatedAt = new Date().toISOString(),
): ActiveMatchSnapshot {
  const { opponentName, opponentId } = summarizeOpponent(game.players, accountProfileId);
  const matchId = resolveSnapshotMatchId(game);

  return {
    id: matchId,
    gameMode: "x01",
    resumeHref: buildActiveMatchResumeHref("x01", matchId, game.gameType),
    matchType: String(game.gameType),
    opponentId,
    opponentName,
    progress: formatCricketMatchProgress(game.players),
    updatedAt,
    gameState: {
      ...game,
      matchId,
    },
  };
}

export function serializeActiveMatchGameState(snapshot: ActiveMatchSnapshot): StoredActiveMatchEnvelope {
  return {
    version: 1,
    gameState: snapshot.gameState,
  };
}

export function parseStoredActiveMatchGameState(value: unknown): X01GameState | CricketGameState {
  if (value && typeof value === "object" && "version" in value && (value as StoredActiveMatchEnvelope).version === 1) {
    return (value as StoredActiveMatchEnvelope).gameState;
  }

  return value as X01GameState | CricketGameState;
}

export function buildSnapshotFromPlayingGame(
  gameMode: ActiveMatchGameMode,
  game: X01GameState | CricketGameState,
  userId: string,
): ActiveMatchSnapshot | null {
  if (game.status !== "playing") {
    return null;
  }

  const accountProfileId = getAccountProfileId(userId);
  const accountPlayer = game.players.find((player) => player.profileId === accountProfileId);

  if (!accountPlayer) {
    return null;
  }

  return gameMode === "cricket"
    ? buildCricketSnapshot(game as CricketGameState, accountProfileId)
    : buildX01Snapshot(game as X01GameState, accountProfileId);
}

export function buildPersistedMatchSnapshot(
  gameMode: ActiveMatchGameMode,
  game: X01GameState | CricketGameState,
): ActiveMatchSnapshot {
  const matchId = resolveSnapshotMatchId(game);
  const updatedAt = new Date().toISOString();
  const opponents = game.players.slice(1);
  const opponentName =
    opponents.length > 0
      ? opponents.map((player) => getPlayerScorecardName(player)).join(", ")
      : getPlayerScorecardName(game.players[0]!);
  const opponentId =
    opponents[0]?.profileId && isCloudProfileId(opponents[0].profileId)
      ? opponents[0].profileId
      : null;
  const gameState = {
    ...game,
    matchId,
  };

  if (gameMode === "cricket") {
    const cricketGame = gameState as CricketGameState;

    return {
      id: matchId,
      gameMode: "cricket",
      resumeHref: buildActiveMatchResumeHref("cricket", matchId),
      matchType: formatCricketVariantLabel(cricketGame.variant ?? "classic"),
      opponentId,
      opponentName,
      progress: formatCricketMatchProgress(cricketGame.players),
      updatedAt,
      gameState: cricketGame,
    };
  }

  const x01Game = gameState as X01GameState;

  return {
    id: matchId,
    gameMode: "x01",
    resumeHref: buildActiveMatchResumeHref("x01", matchId, x01Game.gameType),
    matchType: String(x01Game.gameType),
    opponentId,
    opponentName,
    progress: formatCricketMatchProgress(x01Game.players),
    updatedAt,
    gameState: x01Game,
  };
}

export function persistPlayingMatchToCloudStore(
  gameMode: ActiveMatchGameMode,
  game: X01GameState | CricketGameState | null,
) {
  if (!game || game.status !== "playing") {
    return;
  }

  useActiveMatchCloudStore.getState().upsertSnapshot(buildPersistedMatchSnapshot(gameMode, game));
}

export function getActiveMatchSnapshots(userId: string | undefined): ActiveMatchSnapshot[] {
  if (!userId) {
    return [];
  }

  const accountProfileId = getAccountProfileId(userId);
  const snapshots: ActiveMatchSnapshot[] = [];
  let cricketGame = useCricketStore.getState().game;

  if (cricketGame?.status === "playing" && !cricketGame.matchId) {
    cricketGame = { ...cricketGame, matchId: createMatchId() };
    useCricketStore.setState({ game: cricketGame });
  }

  if (cricketGame?.status === "playing") {
    const accountPlayer = cricketGame.players.find(
      (player) => player.profileId === accountProfileId,
    );

    if (accountPlayer) {
      snapshots.push(buildCricketSnapshot(cricketGame, accountProfileId));
    }
  }

  let x01Game = useX01Store.getState().game;

  if (x01Game?.status === "playing" && !x01Game.matchId) {
    x01Game = { ...x01Game, matchId: createMatchId() };
    useX01Store.setState({ game: x01Game });
  }

  if (x01Game?.status === "playing") {
    const accountPlayer = x01Game.players.find((player) => player.profileId === accountProfileId);

    if (accountPlayer) {
      snapshots.push(buildX01Snapshot(x01Game, accountProfileId));
    }
  }

  return snapshots;
}

/** @deprecated Use getActiveMatchSnapshots instead. */
export function getActiveMatchSnapshot(userId: string | undefined): ActiveMatchSnapshot | null {
  return getActiveMatchSnapshots(userId)[0] ?? null;
}

export function sortActiveMatchSnapshots(
  snapshots: ActiveMatchSnapshot[],
): ActiveMatchSnapshot[] {
  return [...snapshots].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export function mergeActiveMatchSnapshots(
  existing: ActiveMatchSnapshot[],
  updates: ActiveMatchSnapshot[],
): ActiveMatchSnapshot[] {
  const merged = new Map(existing.map((snapshot) => [snapshot.id, snapshot]));

  for (const snapshot of updates) {
    merged.set(snapshot.id, snapshot);
  }

  return sortActiveMatchSnapshots([...merged.values()]);
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
        id: snapshot.id,
        href: snapshot.resumeHref,
        userName: summary.userName,
        opponentName: summary.opponentName,
        opponentProfileId: summary.opponentProfileId,
        opponentAvatarUrl: summary.opponentAvatarUrl,
        opponentColor: summary.opponentColor,
        matchType: snapshot.matchType,
        progress: snapshot.progress,
        updatedAt: snapshot.updatedAt,
      };
    }
  }

  return {
    id: snapshot.id,
    href: snapshot.resumeHref,
    userName: accountDisplayName?.trim() || "You",
    opponentName: snapshot.opponentName,
    opponentProfileId: snapshot.opponentId ?? undefined,
    matchType: snapshot.matchType,
    progress: snapshot.progress,
    updatedAt: snapshot.updatedAt,
  };
}

export function restoreActiveMatchSnapshot(snapshot: ActiveMatchSnapshot) {
  if (snapshot.gameMode === "cricket") {
    useCricketStore.getState().restoreGame(snapshot.gameState as CricketGameState);
    rebuildPendingMatchStatsFromGame(snapshot.gameState);
    return;
  }

  useX01Store.getState().restoreGame(snapshot.gameState as X01GameState);
  rebuildPendingMatchStatsFromGame(snapshot.gameState);
}

export function stashPlayingGameSnapshot(
  gameMode: ActiveMatchGameMode,
  game: X01GameState | CricketGameState,
  userId: string,
): ActiveMatchSnapshot | null {
  const snapshot = buildSnapshotFromPlayingGame(gameMode, game, userId);

  if (!snapshot) {
    return null;
  }

  useActiveMatchCloudStore.getState().upsertSnapshot(snapshot);
  return snapshot;
}
