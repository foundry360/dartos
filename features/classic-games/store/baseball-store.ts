"use client";

import { create } from "zustand";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyBaseballDart,
  createBaseballGame,
  finishBaseballVisit,
  undoBaseballDart,
} from "@/features/classic-games/lib/baseball-engine";
import type { BaseballGameState, BaseballMatchSetup } from "@/types/baseball";
import type { DartHit } from "@/types/dart";

interface BaseballStore {
  setup: BaseballMatchSetup | null;
  game: BaseballGameState | null;
  startGame: (setup: BaseballMatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useBaseballStore = create<BaseballStore>((set, get) => ({
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
    const enrichedSetup: BaseballMatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createBaseballGame(enrichedSetup),
        matchId: createMatchId(),
      },
    });
  },
  throwDart: (hit) => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: applyBaseballDart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    set({ game: finishBaseballVisit(game) });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoBaseballDart(game) });
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
