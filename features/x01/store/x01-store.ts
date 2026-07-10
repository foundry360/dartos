"use client";

import { create } from "zustand";
import { DEFAULT_LEGS, DEFAULT_SETS, DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { X01GameState, X01PlayerState } from "@/types/x01";
import type { X01MatchSetup } from "@/types/player-setup";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import {
  recordX01DartForPlayer,
  recordX01GameProgress,
  recordX01VisitCompleted,
  recordX01TurnForPlayers,
} from "@/features/statistics/lib/record-player-session-stats";
import { discardPendingMatchStats } from "@/features/statistics/store/pending-match-stats-store";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { resolveLegStarterIndex } from "@/features/players/lib/starting-player";
import { orderSetupSlotsForTeams, normalizeTeamNames } from "@/features/players/lib/team-display";
import {
  applyX01Dart,
  createX01Player,
  finishX01Turn,
  undoX01Dart,
} from "@/features/x01/lib/x01-engine";
import { createMatchId } from "@/features/match-play/lib/match-id";
import { persistPlayingMatchToCloudStore } from "@/features/match-play/lib/active-match-snapshot";

interface X01Store {
  game: X01GameState | null;
  startGame: (setup: X01MatchSetup) => void;
  restoreGame: (game: X01GameState) => void;
  throwDart: (hit: DartHit) => void;
  nextPlayer: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

function normalizeInRule(value: unknown): X01GameState["inRule"] {
  if (value === "double_in") {
    return "double_in";
  }

  return "straight_in";
}

function normalizeOutRule(value: unknown): X01GameState["outRule"] {
  if (value === "straight_out") {
    return "straight_out";
  }

  return "double_out";
}

function normalizeGame(game: X01GameState): X01GameState {
  const inRule = normalizeInRule(game.inRule);
  const outRule = normalizeOutRule(game.outRule);

  return {
    ...game,
    legsToWin: game.legsToWin ?? DEFAULT_LEGS,
    setsToWin: game.setsToWin ?? DEFAULT_SETS,
    teamsEnabled: game.teamsEnabled ?? false,
    teamNames: normalizeTeamNames(game.teamNames),
    startingPlayerRule: game.startingPlayerRule ?? "winner_previous_leg",
    inRule,
    outRule,
    legsPlayed: game.legsPlayed ?? 0,
    visitStartScoredIn: game.visitStartScoredIn ?? inRule === "straight_in",
    isBotMatch:
      game.isBotMatch ??
      game.players.some(
        (player) => player.playerKind === "bot" || player.botDifficultyId != null,
      ),
    players: game.players.map((player) => normalizePlayer(player, inRule)),
  };
}

function normalizePlayer(player: X01PlayerState, inRule: X01GameState["inRule"]): X01PlayerState {
  const playerKind = player.playerKind ?? (player.botDifficultyId ? "bot" : "human");

  return {
    ...player,
    legsWon: player.legsWon ?? 0,
    setsWon: player.setsWon ?? 0,
    nickname: player.nickname ?? null,
    scoredIn: player.scoredIn ?? inRule === "straight_in",
    teamId: player.teamId,
    profileId: player.profileId,
    isGuest: player.isGuest,
    avatarUrl: player.avatarUrl,
    playerKind,
    botDifficultyId: player.botDifficultyId,
  };
}

export const useX01Store = create<X01Store>()((set, get) => ({
      game: null,

      restoreGame: (game) => {
        set({ game: normalizeGame(game) });
      },

      startGame: (setup) => {
        discardPendingMatchStats();

        const existingGame = get().game;
        if (existingGame?.status === "playing") {
          persistPlayingMatchToCloudStore("x01", existingGame);
        }

        const {
          gameType,
          legsToWin = DEFAULT_LEGS,
          setsToWin = DEFAULT_SETS,
          teamsEnabled = false,
          teamNames: setupTeamNames = ["Team 1", "Team 2"],
          startingPlayerRule = "winner_previous_leg",
          inRule = "straight_in",
          outRule = "double_out",
          players: setupPlayers,
          coinTossStarterIndex,
          isBotMatch = false,
        } = setup;

        const boardThemeId = useSettingsStore.getState().boardThemeId;
        const playerColors = getBoardThemePlayerColors(
          getActiveBoardThemeColors(boardThemeId),
        );

        const orderedSlots = teamsEnabled
          ? orderSetupSlotsForTeams(setupPlayers)
          : setupPlayers;

        const players = orderedSlots.map((slot, index) =>
          createX01Player(
            `player-${index}`,
            slot.name.trim() || `Player ${index + 1}`,
            slot.color ?? playerColors[index % playerColors.length] ?? playerColors[0]!,
            gameType,
            {
              nickname: slot.nickname,
              teamId: teamsEnabled ? slot.teamId : undefined,
              profileId: slot.profileId,
              isGuest: slot.source === "guest",
              avatarUrl: slot.avatarUrl,
              scoredIn: inRule === "straight_in",
              playerKind: slot.source === "bot" ? "bot" : "human",
              botDifficultyId: slot.botDifficultyId,
            },
          ),
        );

        const rememberGuest = useRecentPlayersStore.getState().rememberGuest;

        for (const slot of setupPlayers) {
          if (slot.source === "guest") {
            rememberGuest(slot.name);
          }
        }

        const currentPlayerIndex = resolveLegStarterIndex(startingPlayerRule, {
          playerCount: players.length,
          legNumber: 1,
          coinTossStarterIndex,
        });

        set({
          game: {
            gameType,
            players,
            currentPlayerIndex,
            visitDarts: [],
            visitStartRemaining: players[currentPlayerIndex]?.remaining ?? gameType,
            visitStartScoredIn: inRule === "straight_in",
            legsToWin,
            setsToWin,
            teamsEnabled,
            teamNames: normalizeTeamNames(setupTeamNames),
            startingPlayerRule,
            inRule,
            outRule,
            coinTossStarterIndex,
            legsPlayed: 0,
            history: [],
            status: "playing",
            matchId: createMatchId(),
            isBotMatch,
          },
        });
      },

      throwDart: (hit) => {
        const { game } = get();
        if (!game || game.visitDarts.length >= DARTS_PER_VISIT) {
          return;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        const nextGame = applyX01Dart(game, hit);

        if (currentPlayer) {
          recordX01DartForPlayer(currentPlayer, hit);
        }

        const visitScore = getX01VisitEffectiveScore(nextGame, game.visitDarts.length + 1);

        if (nextGame.legsPlayed > game.legsPlayed || nextGame.status === "finished") {
          recordX01TurnForPlayers({
            before: game,
            after: nextGame,
            currentPlayer,
            visitScore,
          });
        }

        set({ game: nextGame });
      },

      nextPlayer: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        const visitScore = getX01VisitEffectiveScore(game, game.visitDarts.length);
        const nextGame = finishX01Turn(game);

        recordX01VisitCompleted(currentPlayer, visitScore);
        recordX01GameProgress({
          before: game,
          after: nextGame,
          legWinner: undefined,
        });

        set({ game: nextGame });
      },

      undo: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        set({ game: undoX01Dart(game) });
      },

      rematch: () => {
        const game = get().game;
        if (!game) {
          return;
        }

        discardPendingMatchStats();

        const players = game.players.map((player, index) =>
          createX01Player(
            `player-${index}`,
            player.name,
            player.color,
            game.gameType,
            {
              nickname: player.nickname,
              teamId: player.teamId,
              profileId: player.profileId,
              isGuest: player.isGuest,
              avatarUrl: player.avatarUrl,
              scoredIn: game.inRule === "straight_in",
              playerKind: player.playerKind,
              botDifficultyId: player.botDifficultyId,
            },
          ),
        );

        const currentPlayerIndex = resolveLegStarterIndex(game.startingPlayerRule, {
          playerCount: players.length,
          legNumber: 1,
          coinTossStarterIndex: game.coinTossStarterIndex,
        });

        set({
          game: {
            gameType: game.gameType,
            players,
            currentPlayerIndex,
            visitDarts: [],
            visitStartRemaining: players[currentPlayerIndex]?.remaining ?? game.gameType,
            visitStartScoredIn: game.inRule === "straight_in",
            legsToWin: game.legsToWin,
            setsToWin: game.setsToWin,
            teamsEnabled: game.teamsEnabled,
            teamNames: game.teamNames,
            startingPlayerRule: game.startingPlayerRule,
            inRule: game.inRule,
            outRule: game.outRule,
            coinTossStarterIndex: game.coinTossStarterIndex,
            legsPlayed: 0,
            history: [],
            status: "playing",
            matchId: createMatchId(),
            isBotMatch: game.isBotMatch,
          },
        });
      },

      reset: () => set({ game: null }),
    }));
