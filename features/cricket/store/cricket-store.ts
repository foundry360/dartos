"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { CricketGameState } from "@/types/cricket";
import {
  applyCricketDart,
  createCricketPlayer,
  finishCricketTurn,
  undoCricketDart,
} from "@/features/cricket/lib/cricket-engine";
import { PLAYER_COLORS } from "@/utils/dartboard/constants";

interface CricketStore {
  game: CricketGameState | null;
  startGame: (playerNames: string[], cutThroat?: boolean) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  reset: () => void;
}

export const useCricketStore = create<CricketStore>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (playerNames, cutThroat = false) => {
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
    },
  ),
);
