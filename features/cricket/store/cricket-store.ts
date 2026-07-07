"use client";

import { create } from "zustand";
import { DEFAULT_LEGS, DEFAULT_SETS, DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import type { CricketMatchSetup } from "@/types/player-setup";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import {
  applyCricketDart,
  createCricketPlayer,
  finishCricketTurn,
  getCricketLegWinner,
  normalizeCricketMarks,
  undoCricketDart,
} from "@/features/cricket/lib/cricket-engine";
import {
  recordCricketDartForSavedPlayer,
  recordCricketTurnForSavedPlayers,
} from "@/features/players/lib/cricket-saved-player-stats";
import { discardPendingMatchStats } from "@/features/statistics/store/pending-match-stats-store";
import { resolveLegStarterIndex } from "@/features/cricket/lib/starting-player";
import { orderSetupSlotsForTeams } from "@/features/cricket/lib/team-display";
import { normalizeTeamNames } from "@/features/players/lib/team-display";

interface CricketStore {
  game: CricketGameState | null;
  startGame: (setup: CricketMatchSetup) => void;
  restoreGame: (game: CricketGameState) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  reset: () => void;
}

function normalizePlayer(player: CricketPlayerState): CricketPlayerState {
  return {
    ...player,
    legsWon: player.legsWon ?? 0,
    setsWon: player.setsWon ?? 0,
    teamId: player.teamId,
    profileId: player.profileId,
    nickname: player.nickname ?? null,
    isGuest: player.isGuest,
    avatarUrl: player.avatarUrl,
    marks: normalizeCricketMarks(player.marks),
  };
}

function normalizeGame(game: CricketGameState): CricketGameState {
  return {
    ...game,
    variant: game.variant ?? "classic",
    legsToWin: game.legsToWin ?? DEFAULT_LEGS,
    setsToWin: game.setsToWin ?? DEFAULT_SETS,
    teamsEnabled: game.teamsEnabled ?? false,
    teamNames: normalizeTeamNames(game.teamNames),
    startingPlayerRule: game.startingPlayerRule ?? "winner_previous_leg",
    legsPlayed: game.legsPlayed ?? 0,
    players: game.players.map(normalizePlayer),
  };
}

export const useCricketStore = create<CricketStore>()((set, get) => ({
      game: null,

      restoreGame: (game) => {
        set({ game: normalizeGame(game) });
      },

      startGame: (setup) => {
        discardPendingMatchStats();

        const {
          variant = "classic",
          legsToWin = DEFAULT_LEGS,
          setsToWin = DEFAULT_SETS,
          teamsEnabled = false,
          teamNames: setupTeamNames = ["Team 1", "Team 2"],
          startingPlayerRule = "winner_previous_leg",
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
          createCricketPlayer(
            `player-${index}`,
            slot.name.trim() || `Player ${index + 1}`,
            slot.color ?? playerColors[index % playerColors.length] ?? playerColors[0]!,
            {
              nickname: slot.nickname,
              teamId: teamsEnabled ? slot.teamId : undefined,
              profileId: slot.profileId,
              isGuest: slot.source === "guest",
              avatarUrl: slot.avatarUrl,
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
            players,
            currentPlayerIndex,
            visitDarts: [],
            history: [],
            variant,
            cutThroat: false,
            legsToWin,
            setsToWin,
            teamsEnabled,
            teamNames: normalizeTeamNames(setupTeamNames),
            startingPlayerRule,
            coinTossStarterIndex,
            legsPlayed: 0,
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

        if (currentPlayer) {
          recordCricketDartForSavedPlayer(currentPlayer, hit);
        }

        set({ game: applyCricketDart(game, hit) });
      },

      finishTurn: () => {
        const { game } = get();
        if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
          return;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        const visitScore = game.visitDarts.reduce((total, dart) => total + dart.score, 0);
        const legWinner = getCricketLegWinner(game);
        const nextGame = finishCricketTurn(game);

        recordCricketTurnForSavedPlayers({
          before: game,
          after: nextGame,
          currentPlayer,
          visitScore,
          legWinner,
        });

        set({ game: nextGame });
      },

      undo: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        set({ game: undoCricketDart(game) });
      },

      reset: () => set({ game: null }),
    }));
