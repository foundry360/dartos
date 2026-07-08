"use client";

import { create } from "zustand";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyShanghaiDart,
  createShanghaiGame,
  finishShanghaiVisit,
  undoShanghaiDart,
} from "@/features/classic-games/lib/shanghai-engine";
import type { ShanghaiGameState, ShanghaiMatchSetup } from "@/types/shanghai";
import type { DartHit } from "@/types/dart";

interface ShanghaiStore {
  setup: ShanghaiMatchSetup | null;
  game: ShanghaiGameState | null;
  startGame: (setup: ShanghaiMatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useShanghaiStore = create<ShanghaiStore>((set, get) => ({
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
    const enrichedSetup: ShanghaiMatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createShanghaiGame(enrichedSetup),
        matchId: createMatchId(),
      },
    });
  },
  throwDart: (hit) => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: applyShanghaiDart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    set({ game: finishShanghaiVisit(game) });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoShanghaiDart(game) });
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
