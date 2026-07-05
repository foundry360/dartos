"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LEGS, DEFAULT_SETS, DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { CricketGameState, CricketPlayerState } from "@/types/cricket";
import {
  applyCricketDart,
  createCricketPlayer,
  finishCricketTurn,
  undoCricketDart,
} from "@/features/cricket/lib/cricket-engine";
import { PLAYER_COLORS } from "@/utils/dartboard/constants";

interface StartCricketGameOptions {
  cutThroat?: boolean;
  legsToWin?: number;
  setsToWin?: number;
}

interface CricketStore {
  game: CricketGameState | null;
  startGame: (playerNames: string[], options?: StartCricketGameOptions) => void;
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
  };
}

function normalizeGame(game: CricketGameState): CricketGameState {
  return {
    ...game,
    legsToWin: game.legsToWin ?? DEFAULT_LEGS,
    setsToWin: game.setsToWin ?? DEFAULT_SETS,
    players: game.players.map(normalizePlayer),
  };
}

export const useCricketStore = create<CricketStore>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (playerNames, options = {}) => {
        const {
          cutThroat = false,
          legsToWin = DEFAULT_LEGS,
          setsToWin = DEFAULT_SETS,
        } = options;

        set({
          game: {
            players: playerNames.map((name, index) =>
              createCricketPlayer(
                `player-${index}`,
                name,
                PLAYER_COLORS[index % PLAYER_COLORS.length] ?? PLAYER_COLORS[0],
              ),
            ),
            currentPlayerIndex: 0,
            visitDarts: [],
            history: [],
            cutThroat,
            legsToWin,
            setsToWin,
            status: "playing",
          },
        });
      },

      throwDart: (hit) => {
        const { game } = get();
        if (!game || game.visitDarts.length >= DARTS_PER_VISIT) {
          return;
        }

        set({ game: applyCricketDart(game, hit) });
      },

      finishTurn: () => {
        const { game } = get();
        if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
          return;
        }

        set({ game: finishCricketTurn(game) });
      },

      undo: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        set({ game: undoCricketDart(game) });
      },

      reset: () => set({ game: null }),
    }),
    {
      name: "dartscorer-cricket",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as { game?: CricketGameState | null };

        if (!state.game) {
          return state;
        }

        return {
          ...state,
          game: normalizeGame(state.game),
        };
      },
    },
  ),
);
