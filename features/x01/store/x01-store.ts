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

interface X01Store {
  game: X01GameState | null;
  startGame: (setup: X01MatchSetup) => void;
  restoreGame: (game: X01GameState) => void;
  throwDart: (hit: DartHit) => void;
  nextPlayer: () => void;
  undo: () => void;
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
    players: game.players.map((player) => normalizePlayer(player, inRule)),
  };
}

function normalizePlayer(player: X01PlayerState, inRule: X01GameState["inRule"]): X01PlayerState {
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
  };
}

export const useX01Store = create<X01Store>()((set, get) => ({
      game: null,

      restoreGame: (game) => {
        set({ game: normalizeGame(game) });
      },

      startGame: (setup) => {
        discardPendingMatchStats();

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

      reset: () => set({ game: null }),
    }));
