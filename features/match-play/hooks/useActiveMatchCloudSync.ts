"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  deleteActiveMatchForOwner,
  fetchActiveMatchesForOwner,
  upsertActiveMatchForOwner,
} from "@/lib/supabase/queries/active-matches";
import { registerActiveMatchCloudSyncCancel } from "@/features/match-play/lib/active-match-cloud-sync-control";
import {
  getActiveMatchSnapshots,
  mergeActiveMatchSnapshots,
} from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";
import type { CricketGameState } from "@/types/cricket";
import type { X01GameState } from "@/types/x01";

function debounce<T extends (...args: never[]) => void>(fn: T, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}

async function removeFinishedMatch(
  client: ReturnType<typeof createClient>,
  userId: string,
  matchId: string | undefined,
) {
  if (!matchId || !client) {
    return;
  }

  useActiveMatchCloudStore.getState().removeSnapshot(matchId);

  try {
    await deleteActiveMatchForOwner(client, userId, matchId);
  } catch (error) {
    console.error("Failed to delete finished active match from Supabase", formatSupabaseError(error));
  }
}

export function useActiveMatchCloudSync(userId: string | undefined, authLoading = false) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    hydratedRef.current = false;
    useActiveMatchCloudStore.getState().setHydrated(false);

    if (!userId) {
      useActiveMatchCloudStore.getState().reset();
      useX01Store.getState().reset();
      useCricketStore.getState().reset();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      hydratedRef.current = true;
      useActiveMatchCloudStore.getState().setHydrated(true);
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function hydrate() {
      try {
        const cloudMatches = await fetchActiveMatchesForOwner(client, userId!);

        if (cancelled) {
          return;
        }

        useActiveMatchCloudStore.getState().setSnapshots(cloudMatches);
        hydratedRef.current = true;
        useActiveMatchCloudStore.getState().setHydrated(true);
      } catch (error) {
        console.error(
          "Failed to hydrate active match from Supabase",
          formatSupabaseError(error),
        );
        hydratedRef.current = true;
        useActiveMatchCloudStore.getState().setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const client = supabase;

    const syncActiveMatches = debounce(async () => {
      try {
        const liveSnapshots = getActiveMatchSnapshots(userId);
        const mergedSnapshots = mergeActiveMatchSnapshots(
          useActiveMatchCloudStore.getState().snapshots,
          liveSnapshots,
        );

        useActiveMatchCloudStore.getState().setSnapshots(mergedSnapshots);

        if (!hydratedRef.current) {
          return;
        }

        await Promise.all(
          mergedSnapshots
            .filter((snapshot) => snapshot.gameState.status === "playing")
            .map((snapshot) => upsertActiveMatchForOwner(client, userId, snapshot)),
        );
      } catch (error) {
        console.error(
          "Failed to sync active match to Supabase",
          formatSupabaseError(error),
        );
      }
    }, 800);

    const handleCricketChange = (
      game: CricketGameState | null,
      previousGame: CricketGameState | null,
    ) => {
      if (previousGame?.status === "playing" && game?.status === "finished") {
        void removeFinishedMatch(client, userId, previousGame.matchId);
      }

      syncActiveMatches();
    };

    const handleX01Change = (game: X01GameState | null, previousGame: X01GameState | null) => {
      if (previousGame?.status === "playing" && game?.status === "finished") {
        void removeFinishedMatch(client, userId, previousGame.matchId);
      }

      syncActiveMatches();
    };

    const unsubscribeX01 = useX01Store.subscribe((state, previousState) => {
      if (state.game === previousState.game) {
        return;
      }

      handleX01Change(state.game, previousState.game);
    });

    const unsubscribeCricket = useCricketStore.subscribe((state, previousState) => {
      if (state.game === previousState.game) {
        return;
      }

      handleCricketChange(state.game, previousState.game);
    });

    registerActiveMatchCloudSyncCancel(syncActiveMatches.cancel);

    return () => {
      registerActiveMatchCloudSyncCancel(() => {});
      syncActiveMatches.cancel();
      unsubscribeX01();
      unsubscribeCricket();
    };
  }, [authLoading, userId]);
}
