"use client";

import { create } from "zustand";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyKillerDart,
  finishKillerVisit,
  getKillerVisitLimit,
  undoKillerDart,
  createKillerGame,
} from "@/features/classic-games/lib/killer-engine";
import type { KillerGameState, KillerMatchSetup } from "@/types/killer";
import type { DartHit } from "@/types/dart";

interface KillerStore {
  setup: KillerMatchSetup | null;
  game: KillerGameState | null;
  startGame: (setup: KillerMatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useKillerStore = create<KillerStore>((set, get) => ({
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
    const enrichedSetup: KillerMatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createKillerGame(enrichedSetup),
        matchId: createMatchId(),
      },
    });
  },
  throwDart: (hit) => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: applyKillerDart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    const visitLimit = getKillerVisitLimit(game);
    if (game.visitDarts.length < visitLimit) {
      return;
    }

    set({ game: finishKillerVisit(game) });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoKillerDart(game) });
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
