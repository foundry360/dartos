"use client";

import { create } from "zustand";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyCheckout121Dart,
  createCheckout121Game,
  finishCheckout121Visit,
  undoCheckout121Dart,
} from "@/features/classic-games/lib/checkout-121-engine";
import type { Checkout121GameState, Checkout121MatchSetup } from "@/types/checkout-121";
import type { DartHit } from "@/types/dart";

interface Checkout121Store {
  setup: Checkout121MatchSetup | null;
  game: Checkout121GameState | null;
  startGame: (setup: Checkout121MatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useCheckout121Store = create<Checkout121Store>((set, get) => ({
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
    const enrichedSetup: Checkout121MatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createCheckout121Game(enrichedSetup),
        matchId: createMatchId(),
      },
    });
  },
  throwDart: (hit) => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: applyCheckout121Dart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game || game.visitDarts.length === 0) {
      return;
    }

    if (game.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    set({ game: finishCheckout121Visit(game) });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoCheckout121Dart(game) });
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
