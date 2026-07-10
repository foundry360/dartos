"use client";

import { create } from "zustand";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyHalveItDart,
  createHalveItGame,
  finishHalveItVisit,
  undoHalveItDart,
} from "@/features/classic-games/lib/halve-it-engine";
import type { HalveItGameState, HalveItMatchSetup } from "@/types/halve-it";
import type { DartHit } from "@/types/dart";
import {
  recordClassicFormatDartForPlayer,
  recordClassicFormatTurnFinished,
} from "@/features/statistics/lib/record-classic-format-session-stats";

interface HalveItStore {
  setup: HalveItMatchSetup | null;
  game: HalveItGameState | null;
  startGame: (setup: HalveItMatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useHalveItStore = create<HalveItStore>((set, get) => ({
  setup: null,
  game: null,
  startGame: (setup) => {
    const rememberGuest = useRecentPlayersStore.getState().rememberGuest;
    for (const player of setup.players) {
      if (player.source === "guest") {
        rememberGuest(player.name);
      }
    }

    const themeColors = getBoardThemePlayerColors(getActiveBoardThemeColors());
    const enrichedSetup: HalveItMatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createHalveItGame(enrichedSetup),
        matchId: createMatchId(),
      },
    });
  },
  throwDart: (hit) => {
    const { game } = get();
    if (!game) {
      return;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];

    if (game.isBotMatch) {
      recordClassicFormatDartForPlayer(currentPlayer, hit);
    }

    set({ game: applyHalveItDart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const before = game;
    const after = finishHalveItVisit(game);
    set({ game: after });

    recordClassicFormatTurnFinished({
      before,
      after,
      matchType: "Halve-It",
    });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoHalveItDart(game) });
  },
  rematch: () => {
    const { setup } = get();
    if (!setup) {
      return;
    }

    get().startGame(setup);
  },
  reset: () => set({ setup: null, game: null }),
}));
