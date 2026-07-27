"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  type CommunityPublicProfile,
  fetchCommunityProfile,
} from "@/lib/supabase/queries/community-profile";
import type { CommunityMatchConfig } from "@/features/community/lib/community-match-config";
import {
  type CommunityRoom,
  type CommunityRoomMember,
  type OpenCommunityRoom,
  createCommunityRoom,
  fetchCommunityRoomMembers,
  fetchMyCommunityRoom,
  joinCommunityRoom,
  joinCommunityRoomById,
  leaveCommunityRoom,
  listOpenCommunityRooms,
} from "@/lib/supabase/queries/community-rooms";

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useCommunityRoom() {
  const { user } = useAuth();
  const [room, setRoom] = useState<CommunityRoom | null>(null);
  const [members, setMembers] = useState<CommunityRoomMember[]>([]);
  const [profilesByUserId, setProfilesByUserId] = useState<
    Record<string, CommunityPublicProfile>
  >({});
  const [openRooms, setOpenRooms] = useState<OpenCommunityRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOpenRooms = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) {
      setOpenRooms([]);
      return;
    }

    try {
      const rooms = await listOpenCommunityRooms(supabase);
      setOpenRooms(rooms);
    } catch (caught) {
      const message = errorMessage(
        caught,
        "Unable to load open rooms. Apply the latest Community Play migrations.",
      );
      console.error("Unable to load open community rooms", message, caught);
      setError(message);
      setOpenRooms([]);
    }
  }, [user]);

  const loadRoomDetails = useCallback(async (nextRoom: CommunityRoom) => {
    const supabase = createClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const nextMembers = await fetchCommunityRoomMembers(supabase, nextRoom.id);
    const profiles = await Promise.all(
      nextMembers.map(async (member) => {
        try {
          const profile = await fetchCommunityProfile(supabase, member.userId);
          return profile ? ([member.userId, profile] as const) : null;
        } catch {
          return null;
        }
      }),
    );

    const nextProfiles: Record<string, CommunityPublicProfile> = {};
    for (const entry of profiles) {
      if (entry) {
        nextProfiles[entry[0]] = entry[1];
      }
    }

    setRoom(nextRoom);
    setMembers(nextMembers);
    setProfilesByUserId(nextProfiles);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setRoom(null);
      setMembers([]);
      setProfilesByUserId({});
      setOpenRooms([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const existing = await fetchMyCommunityRoom(supabase);
      if (!existing) {
        setRoom(null);
        setMembers([]);
        setProfilesByUserId({});
        await loadOpenRooms();
        return;
      }
      await loadRoomDetails(existing);
      await loadOpenRooms();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to load your room."));
    } finally {
      setLoading(false);
    }
  }, [loadOpenRooms, loadRoomDetails, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll so a waiting host sees an opponent as soon as they Join.
  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const supabase = createClient();
          if (!supabase) {
            return;
          }

          const existing = await fetchMyCommunityRoom(supabase);
          if (existing) {
            await loadRoomDetails(existing);
          } else if (room) {
            setRoom(null);
            setMembers([]);
            setProfilesByUserId({});
          }
          await loadOpenRooms();
        } catch {
          // Ignore background poll errors.
        }
      })();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [loadOpenRooms, loadRoomDetails, room, user]);

  const createRoom = useCallback(
    async (config: CommunityMatchConfig) => {
      const supabase = createClient();
      if (!supabase || !user) {
        setError("Sign in to create a room.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const created = await createCommunityRoom(supabase, config);
        await loadRoomDetails(created);
        await loadOpenRooms();
      } catch (caught) {
        setError(errorMessage(caught, "Unable to create room."));
      } finally {
        setBusy(false);
      }
    },
    [loadOpenRooms, loadRoomDetails, user],
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const supabase = createClient();
      if (!supabase || !user) {
        setError("Sign in to join a room.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const joined = await joinCommunityRoom(supabase, code);
        await loadRoomDetails(joined);
        await loadOpenRooms();
      } catch (caught) {
        setError(errorMessage(caught, "Unable to join room."));
      } finally {
        setBusy(false);
      }
    },
    [loadOpenRooms, loadRoomDetails, user],
  );

  const joinOpenRoom = useCallback(
    async (roomId: string) => {
      const supabase = createClient();
      if (!supabase || !user) {
        setError("Sign in to join a room.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const joined = await joinCommunityRoomById(supabase, roomId);
        await loadRoomDetails(joined);
        await loadOpenRooms();
      } catch (caught) {
        setError(errorMessage(caught, "Unable to join room."));
      } finally {
        setBusy(false);
      }
    },
    [loadOpenRooms, loadRoomDetails, user],
  );

  const leaveRoom = useCallback(async () => {
    if (!room) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await leaveCommunityRoom(supabase, room.id);
      setRoom(null);
      setMembers([]);
      setProfilesByUserId({});
      await loadOpenRooms();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to leave room."));
    } finally {
      setBusy(false);
    }
  }, [loadOpenRooms, room]);

  return {
    user,
    room,
    members,
    profilesByUserId,
    openRooms,
    loading,
    busy,
    error,
    createRoom,
    joinRoom,
    joinOpenRoom,
    leaveRoom,
    refresh,
  };
}
