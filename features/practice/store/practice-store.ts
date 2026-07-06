"use client";

import { create } from "zustand";
import {
  getInitialActiveGame,
  getTimedPracticeSecondsForGame,
  isTimedPracticeGameId,
} from "@/features/practice/lib/practice-routines";
import type { PracticeGameId, PracticeSessionState, PracticeSetup } from "@/types/practice";

interface PracticeStore {
  session: PracticeSessionState | null;
  startSession: (setup: PracticeSetup) => void;
  setActiveGame: (activeGame: PracticeGameId | null) => void;
  setRemainingSeconds: (remainingSeconds: number | null) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeStore>((set) => ({
  session: null,

  startSession: (setup) => {
    set({
      session: {
        setup,
        activeGame: getInitialActiveGame(setup),
        startedAt: new Date().toISOString(),
        remainingSeconds: null,
      },
    });
  },

  setActiveGame: (activeGame) => {
    set((state) => {
      if (!state.session) {
        return state;
      }

      const isTimedSession = state.session.setup.routine.category === "timed";
      const remainingSeconds =
        isTimedSession && activeGame && isTimedPracticeGameId(activeGame)
          ? getTimedPracticeSecondsForGame(activeGame)
          : state.session.remainingSeconds;

      return {
        session: {
          ...state.session,
          activeGame,
          remainingSeconds,
        },
      };
    });
  },

  setRemainingSeconds: (remainingSeconds) => {
    set((state) =>
      state.session
        ? {
            session: {
              ...state.session,
              remainingSeconds,
            },
          }
        : state,
    );
  },

  reset: () => set({ session: null }),
}));
