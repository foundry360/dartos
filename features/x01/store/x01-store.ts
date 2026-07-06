"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { X01GameType } from "@/lib/constants";
import { DEFAULT_LEGS, DEFAULT_SETS, DARTS_PER_VISIT } from "@/lib/constants";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import {
  applyX01Dart,
  createX01Player,
  finishX01Turn,
  undoX01Dart,
} from "@/features/x01/lib/x01-engine";

interface X01Store {
  game: X01GameState | null;
  startGame: (
    gameType: X01GameType,
    playerNames: string[],
    legsToWin?: number,
    setsToWin?: number,
  ) => void;
  throwDart: (hit: DartHit) => void;
  nextPlayer: () => void;
  undo: () => void;
  reset: () => void;
}

export const useX01Store = create<X01Store>()(
  persist(
    (set, get) => ({
      game: null,

      startGame: (
        gameType,
        playerNames,
        legsToWin = DEFAULT_LEGS,
        setsToWin = DEFAULT_SETS,
      ) => {
        const boardThemeId = useSettingsStore.getState().boardThemeId;
        const playerColors = getBoardThemePlayerColors(
          getActiveBoardThemeColors(boardThemeId),
        );

        const players = playerNames.map((name, index) =>
          createX01Player(
            `player-${index}`,
            name,
            playerColors[index % playerColors.length] ?? playerColors[0]!,
            gameType,
          ),
        );

        set({
          game: {
            gameType,
            players,
            currentPlayerIndex: 0,
            visitDarts: [],
            visitStartRemaining: gameType,
            legsToWin,
            setsToWin,
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

        set({ game: applyX01Dart(game, hit) });
      },

      nextPlayer: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        set({ game: finishX01Turn(game) });
      },

      undo: () => {
        const { game } = get();
        if (!game) {
          return;
        }

        set({ game: undoX01Dart(game) });
      },

      reset: () => set({ game: null }),
    }),
    {
      name: "dartscorer-x01",
    },
  ),
);
