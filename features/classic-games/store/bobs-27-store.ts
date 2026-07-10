"use client";

import { create } from "zustand";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getBoardThemePlayerColors } from "@/lib/board-themes";
import { getActiveBoardThemeColors } from "@/features/settings/store/board-themes-store";
import { useRecentPlayersStore } from "@/features/players/store/recent-players-store";
import { createMatchId } from "@/features/match-play/lib/match-id";
import {
  applyBobs27Dart,
  createBobs27Game,
  finishBobs27Visit,
  undoBobs27Dart,
} from "@/features/classic-games/lib/bobs-27-engine";
import type { Bobs27GameState, Bobs27MatchSetup } from "@/types/bobs-27";
import type { DartHit } from "@/types/dart";
import {
  recordClassicFormatDartForPlayer,
  recordClassicFormatTurnFinished,
} from "@/features/statistics/lib/record-classic-format-session-stats";

interface Bobs27Store {
  setup: Bobs27MatchSetup | null;
  game: Bobs27GameState | null;
  startGame: (setup: Bobs27MatchSetup) => void;
  throwDart: (hit: DartHit) => void;
  finishTurn: () => void;
  undo: () => void;
  rematch: () => void;
  reset: () => void;
}

export const useBobs27Store = create<Bobs27Store>((set, get) => ({
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
    const enrichedSetup: Bobs27MatchSetup = {
      ...setup,
      players: setup.players.map((player, index) => ({
        ...player,
        color: player.color ?? themeColors[index % themeColors.length],
      })),
    };

    set({
      setup: enrichedSetup,
      game: {
        ...createBobs27Game(enrichedSetup),
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

    set({ game: applyBobs27Dart(game, hit) });
  },
  finishTurn: () => {
    const { game } = get();
    if (!game || game.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const before = game;
    const after = finishBobs27Visit(game);
    set({ game: after });

    recordClassicFormatTurnFinished({
      before,
      after,
      matchType: "Bob's 27",
    });
  },
  undo: () => {
    const { game } = get();
    if (!game) {
      return;
    }

    set({ game: undoBobs27Dart(game) });
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
