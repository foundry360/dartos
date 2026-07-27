"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type CommunityMatchGameMode,
  type CommunityMatchStateRow,
  clearCommunityMatchIssue,
  currentUserIdFromGameState,
  fetchCommunityMatchState,
  publishCommunityMatchState,
  raiseCommunityMatchIssue,
  seedCommunityMatchState,
} from "@/lib/supabase/queries/community-match-sync";

interface UseCommunityMatchSyncOptions {
  roomId: string | null;
  userId: string | null;
  gameMode: CommunityMatchGameMode;
  enabled: boolean;
  isHost: boolean;
  /** Auth user ids in engine player order (seat 0, seat 1, …). */
  playerUserIds: string[];
  getLocalState: () => Record<string, unknown> | null;
  restoreRemoteState: (state: Record<string, unknown>) => void;
}

export function useCommunityMatchSync({
  roomId,
  userId,
  gameMode,
  enabled,
  isHost,
  playerUserIds,
  getLocalState,
  restoreRemoteState,
}: UseCommunityMatchSyncOptions) {
  const [revision, setRevision] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [issueRaisedBy, setIssueRaisedBy] = useState<string | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const issueRaisedByRef = useRef<string | null>(null);
  const applyingRemoteRef = useRef(false);
  const mountedRef = useRef(false);
  const getLocalStateRef = useRef(getLocalState);
  const restoreRemoteStateRef = useRef(restoreRemoteState);
  const playerUserIdsRef = useRef(playerUserIds);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    getLocalStateRef.current = getLocalState;
    restoreRemoteStateRef.current = restoreRemoteState;
    playerUserIdsRef.current = playerUserIds;
  }, [getLocalState, playerUserIds, restoreRemoteState]);

  const resolveCurrentUserId = useCallback(
    (
      rowCurrent: string | null | undefined,
      state: Record<string, unknown> | null | undefined,
    ) => {
      if (rowCurrent) {
        return rowCurrent;
      }
      return currentUserIdFromGameState(state, playerUserIdsRef.current);
    },
    [],
  );

  const applyRemoteRow = useCallback(
    (row: CommunityMatchStateRow) => {
      if (!mountedRef.current) {
        return;
      }
      if (row.revision < revisionRef.current) {
        return;
      }

      const resolvedCurrent = resolveCurrentUserId(row.currentUserId, row.state);

      // Same revision: refresh turn + issue flags.
      if (row.revision === revisionRef.current && revisionRef.current > 0) {
        setCurrentUserId(resolvedCurrent);
        issueRaisedByRef.current = row.issueRaisedBy;
        setIssueRaisedBy(row.issueRaisedBy);
        setSyncReady(true);
        return;
      }

      applyingRemoteRef.current = true;
      revisionRef.current = row.revision;
      const nextState = row.state;

      setRevision(row.revision);
      setCurrentUserId(resolvedCurrent);
      issueRaisedByRef.current = row.issueRaisedBy;
      setIssueRaisedBy(row.issueRaisedBy);
      setSyncReady(true);
      setSyncError(null);

      // Restore the engine store after this React update finishes. Calling
      // zustand set() inline re-enters render while children are still mounting.
      queueMicrotask(() => {
        if (!mountedRef.current) {
          applyingRemoteRef.current = false;
          return;
        }
        restoreRemoteStateRef.current(nextState);
        applyingRemoteRef.current = false;
      });
    },
    [resolveCurrentUserId],
  );

  const publishLocalState = useCallback(async () => {
    if (!roomId || !enabled || applyingRemoteRef.current) {
      return false;
    }
    const supabase = createClient();
    const local = getLocalStateRef.current();
    if (!supabase || !local) {
      return false;
    }

    const nextCurrent = currentUserIdFromGameState(
      local,
      playerUserIdsRef.current,
    );
    try {
      const published = await publishCommunityMatchState(supabase, {
        roomId,
        expectedRevision: revisionRef.current,
        state: local,
        currentUserId: nextCurrent,
      });
      if (!mountedRef.current) {
        return false;
      }
      revisionRef.current = published.revision;
      setRevision(published.revision);
      setCurrentUserId(published.currentUserId);
      issueRaisedByRef.current = published.issueRaisedBy;
      setIssueRaisedBy(published.issueRaisedBy);
      setSyncError(null);
      return true;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to sync match state.";
      // Recover from conflicts by pulling the server snapshot.
      try {
        const latest = await fetchCommunityMatchState(supabase, roomId);
        if (latest && mountedRef.current) {
          applyRemoteRow(latest);
        }
      } catch {
        // ignore secondary failure
      }
      if (mountedRef.current) {
        setSyncError(message);
      }
      return false;
    }
  }, [applyRemoteRow, enabled, roomId]);

  const raiseIssue = useCallback(async () => {
    if (!roomId || !enabled || !userId) {
      return false;
    }
    const supabase = createClient();
    if (!supabase) {
      return false;
    }
    // Optimistic pause so the raiser locks immediately while RPC/realtime catch up.
    issueRaisedByRef.current = userId;
    setIssueRaisedBy(userId);
    try {
      const row = await raiseCommunityMatchIssue(supabase, roomId);
      if (!mountedRef.current) {
        return false;
      }
      applyRemoteRow(row);
      setSyncError(null);
      return true;
    } catch (caught) {
      if (mountedRef.current) {
        issueRaisedByRef.current = null;
        setIssueRaisedBy(null);
        setSyncError(
          caught instanceof Error
            ? caught.message
            : "Unable to raise score issue.",
        );
      }
      return false;
    }
  }, [applyRemoteRow, enabled, roomId, userId]);

  const clearIssue = useCallback(async () => {
    if (!roomId || !enabled) {
      return false;
    }
    const supabase = createClient();
    if (!supabase) {
      return false;
    }
    const previous = issueRaisedByRef.current;
    issueRaisedByRef.current = null;
    setIssueRaisedBy(null);
    try {
      const row = await clearCommunityMatchIssue(supabase, roomId);
      if (!mountedRef.current) {
        return false;
      }
      applyRemoteRow(row);
      setSyncError(null);
      return true;
    } catch (caught) {
      if (mountedRef.current) {
        issueRaisedByRef.current = previous;
        setIssueRaisedBy(previous);
        setSyncError(
          caught instanceof Error
            ? caught.message
            : "Unable to clear score issue.",
        );
      }
      return false;
    }
  }, [applyRemoteRow, enabled, roomId]);

  // Hydrate / seed once the match screen is ready.
  useEffect(() => {
    if (!enabled || !roomId || !userId) {
      revisionRef.current = 0;
      issueRaisedByRef.current = null;
      setRevision(0);
      setCurrentUserId(null);
      setIssueRaisedBy(null);
      setSyncReady(false);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setSyncError("Supabase is not configured.");
      return;
    }

    const hydrate = async () => {
      try {
        const existing = await fetchCommunityMatchState(supabase, roomId);
        if (cancelled || !mountedRef.current) {
          return;
        }

        if (existing) {
          applyRemoteRow(existing);
          const repairedCurrent = resolveCurrentUserId(
            existing.currentUserId,
            existing.state,
          );
          if (
            isHost &&
            !existing.currentUserId &&
            repairedCurrent &&
            existing.state.status === "playing"
          ) {
            revisionRef.current = existing.revision;
            const repaired = await publishCommunityMatchState(supabase, {
              roomId,
              expectedRevision: existing.revision,
              state: existing.state,
              currentUserId: repairedCurrent,
            });
            if (!cancelled && mountedRef.current) {
              applyRemoteRow(repaired);
            }
          }
          return;
        }

        if (!isHost) {
          // Wait for host to seed — poll briefly.
          return;
        }

        const local = getLocalStateRef.current();
        if (!local) {
          return;
        }

        const starterId = currentUserIdFromGameState(
          local,
          playerUserIdsRef.current,
        );
        if (!starterId) {
          if (!cancelled && mountedRef.current) {
            setSyncError("Unable to determine who starts this match.");
          }
          return;
        }

        const seeded = await seedCommunityMatchState(supabase, {
          roomId,
          gameMode,
          state: local,
          currentUserId: starterId,
        });
        if (cancelled || !mountedRef.current) {
          return;
        }
        applyRemoteRow(seeded);

        // Older seed rows may have null current_user_id — publish once to repair.
        if (!seeded.currentUserId) {
          revisionRef.current = seeded.revision;
          const repaired = await publishCommunityMatchState(supabase, {
            roomId,
            expectedRevision: seeded.revision,
            state: local,
            currentUserId: starterId,
          });
          if (!cancelled && mountedRef.current) {
            applyRemoteRow(repaired);
          }
        }
      } catch (caught) {
        if (!cancelled && mountedRef.current) {
          setSyncError(
            caught instanceof Error
              ? caught.message
              : "Unable to sync this match.",
          );
        }
      }
    };

    void hydrate();

    const pollId = window.setInterval(() => {
      if (cancelled || revisionRef.current > 0) {
        return;
      }
      void fetchCommunityMatchState(supabase, roomId)
        .then((row) => {
          if (!cancelled && mountedRef.current && row) {
            applyRemoteRow(row);
          }
        })
        .catch(() => {
          // ignore poll errors
        });
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [
    applyRemoteRow,
    enabled,
    gameMode,
    isHost,
    playerUserIds,
    resolveCurrentUserId,
    roomId,
    userId,
  ]);

  // Realtime fan-out of snapshots.
  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`community-match:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_match_states",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const next = payload.new as {
            room_id?: string;
            game_mode?: string;
            revision?: number;
            state?: Record<string, unknown>;
            current_user_id?: string | null;
            updated_by?: string | null;
            updated_at?: string;
            issue_raised_by?: string | null;
            issue_raised_at?: string | null;
          } | null;
          if (!next?.room_id || !next.state || next.revision == null) {
            return;
          }
          if (next.game_mode !== "x01" && next.game_mode !== "cricket") {
            return;
          }
          applyRemoteRow({
            roomId: next.room_id,
            gameMode: next.game_mode,
            revision: Number(next.revision) || 0,
            state: next.state,
            currentUserId: next.current_user_id ?? null,
            updatedBy: next.updated_by ?? null,
            updatedAt: next.updated_at ?? new Date().toISOString(),
            // If Realtime omits the new column, keep the prior pause flag.
            issueRaisedBy:
              "issue_raised_by" in next
                ? (next.issue_raised_by ?? null)
                : issueRaisedByRef.current,
            issueRaisedAt:
              "issue_raised_at" in next
                ? (next.issue_raised_at ?? null)
                : null,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyRemoteRow, enabled, roomId]);

  // Backup poll — catches pause/resume if a Realtime event is missed.
  useEffect(() => {
    if (!enabled || !roomId || !syncReady) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const pollId = window.setInterval(() => {
      void fetchCommunityMatchState(supabase, roomId)
        .then((row) => {
          if (!mountedRef.current || !row) {
            return;
          }
          if (row.revision !== revisionRef.current) {
            applyRemoteRow(row);
            return;
          }
          issueRaisedByRef.current = row.issueRaisedBy;
          setIssueRaisedBy(row.issueRaisedBy);
          const resolved = resolveCurrentUserId(row.currentUserId, row.state);
          if (resolved) {
            setCurrentUserId(resolved);
          }
        })
        .catch(() => {
          // ignore poll errors
        });
    }, 2000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [applyRemoteRow, enabled, resolveCurrentUserId, roomId, syncReady]);

  // Prefer server pointer; fall back to engine index → seat → auth user.
  const localState = getLocalState();
  const derivedCurrentUserId = currentUserIdFromGameState(
    localState,
    playerUserIds,
  );
  const effectiveCurrentUserId = currentUserId ?? derivedCurrentUserId;
  const isMyTurn = Boolean(
    syncReady && userId && effectiveCurrentUserId === userId,
  );
  const issueActive = Boolean(issueRaisedBy);

  return {
    revision,
    currentUserId: effectiveCurrentUserId,
    syncReady,
    syncError,
    isMyTurn,
    issueActive,
    issueRaisedBy,
    raiseIssue,
    clearIssue,
    publishLocalState,
  };
}
