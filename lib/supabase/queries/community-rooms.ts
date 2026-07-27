import type { CommunityMatchConfig } from "@/features/community/lib/community-match-config";
import { fetchCommunityProfile } from "@/lib/supabase/queries/community-profile";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityRoomRow = Database["public"]["Tables"]["community_rooms"]["Row"];
export type CommunityRoomMemberRow =
  Database["public"]["Tables"]["community_room_members"]["Row"];

export interface CommunityRoomMember {
  roomId: string;
  userId: string;
  seat: number | null;
  role: "host" | "player" | "spectator";
  joinedAt: string;
}

export interface CommunityRoom {
  id: string;
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "ended";
  gameType: string | null;
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value !== "null" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function mapRoom(row: CommunityRoomRow | null | undefined): CommunityRoom | null {
  if (!row || !isUuid(row.id) || !isUuid(row.host_id) || !row.code) {
    return null;
  }

  return {
    id: row.id,
    code: row.code,
    hostId: row.host_id,
    status: row.status,
    gameType: row.game_type,
    rules:
      row.rules && typeof row.rules === "object" && !Array.isArray(row.rules)
        ? (row.rules as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function mapMember(row: CommunityRoomMemberRow): CommunityRoomMember {
  return {
    roomId: row.room_id,
    userId: row.user_id,
    seat: row.seat,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function generateCommunityRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "A";
  }
  return code;
}

export async function createCommunityRoom(
  supabase: SupabaseClient<Database>,
  config: CommunityMatchConfig,
): Promise<CommunityRoom> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error("Sign in to create a room.");
  }

  // Close any existing lobby the user still hosts.
  const { data: existingLobbies, error: existingError } = await supabase
    .from("community_rooms")
    .select("id")
    .eq("host_id", user.id)
    .eq("status", "lobby");

  if (existingError) {
    throw existingError;
  }

  const existingIds = (existingLobbies ?? []).map((row) => row.id).filter(isUuid);
  if (existingIds.length > 0) {
    const { error: closeError } = await supabase
      .from("community_rooms")
      .update({ status: "ended", updated_at: new Date().toISOString() })
      .in("id", existingIds);
    if (closeError) {
      throw closeError;
    }
  }

  let created: CommunityRoomRow | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateCommunityRoomCode();
    const { data, error } = await supabase
      .from("community_rooms")
      .insert({
        code,
        host_id: user.id,
        status: "lobby",
        game_type: config.gameType,
        rules: config.rules as unknown as Json,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      created = data as CommunityRoomRow;
      break;
    }

    lastError = error;
    // Unique violation on code — retry with a new code.
    if (error && "code" in error && error.code !== "23505") {
      throw error;
    }
  }

  if (!created) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to create room. Apply the community room insert policies migration.");
  }

  const { error: memberError } = await supabase.from("community_room_members").insert({
    room_id: created.id,
    user_id: user.id,
    seat: 0,
    role: "host",
  });

  if (memberError) {
    await supabase.from("community_rooms").delete().eq("id", created.id);
    throw memberError;
  }

  const room = mapRoom(created);
  if (!room) {
    throw new Error("Unable to create room.");
  }
  return room;
}

export async function joinCommunityRoom(
  supabase: SupabaseClient<Database>,
  code: string,
): Promise<CommunityRoom> {
  const { data, error } = await supabase.rpc("join_community_room", {
    join_code: code,
  });
  if (error) {
    throw error;
  }
  const room = mapRoom(data as CommunityRoomRow);
  if (!room) {
    throw new Error("Unable to join room.");
  }
  return room;
}

export async function leaveCommunityRoom(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<void> {
  if (!isUuid(roomId)) {
    return;
  }

  const { error } = await supabase.rpc("leave_community_room", {
    target_room_id: roomId,
  });
  if (error) {
    throw error;
  }
}

export async function fetchMyCommunityRoom(
  supabase: SupabaseClient<Database>,
): Promise<CommunityRoom | null> {
  const { data, error } = await supabase.rpc("get_my_community_room");
  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return mapRoom(row as CommunityRoomRow | null | undefined);
}

export async function fetchCommunityRoomMembers(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<CommunityRoomMember[]> {
  if (!isUuid(roomId)) {
    return [];
  }

  const { data, error } = await supabase
    .from("community_room_members")
    .select("*")
    .eq("room_id", roomId)
    .order("seat", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data as CommunityRoomMemberRow[]).map(mapMember);
}

export interface OpenCommunityRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  createdAt: string;
  gameType: string | null;
  rules: Record<string, unknown>;
  hostDisplayName: string | null;
  hostNickname: string | null;
  hostAvatarUrl: string | null;
  hostCountryCode: string | null;
  hostThreeDartAverage: number;
  alreadyRequested: boolean;
}

export interface CommunityJoinRequest {
  requestId: string;
  roomId: string;
  requesterId: string;
  createdAt: string;
  requesterDisplayName: string | null;
  requesterNickname: string | null;
  requesterAvatarUrl: string | null;
  requesterCountryCode: string | null;
  requesterThreeDartAverage: number;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function rpcErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const candidate = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };
  const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" — ") : fallback;
}

export async function listOpenCommunityRooms(
  supabase: SupabaseClient<Database>,
): Promise<OpenCommunityRoom[]> {
  const { data, error } = await supabase.rpc("list_open_community_rooms", {
    result_limit: 30,
  });
  if (error) {
    throw new Error(
      rpcErrorMessage(
        error,
        "Unable to load open rooms. Apply the latest Community Play migrations.",
      ),
    );
  }

  return (data ?? []).map((row) => {
    const record = row as {
      room_id: string;
      room_code: string;
      host_id: string;
      created_at: string;
      game_type?: string | null;
      rules?: unknown;
      host_display_name: string | null;
      host_nickname: string | null;
      host_avatar_url: string | null;
      host_country_code: string | null;
      host_three_dart_average: number | string | null;
      already_requested: boolean;
    };

    return {
      roomId: record.room_id,
      // Public feed intentionally omits codes; hosts see code on their own card.
      roomCode: record.room_code ?? "",
      hostId: record.host_id,
      createdAt: record.created_at,
      gameType: record.game_type ?? null,
      rules:
        record.rules &&
        typeof record.rules === "object" &&
        !Array.isArray(record.rules)
          ? (record.rules as Record<string, unknown>)
          : {},
      hostDisplayName: record.host_display_name,
      hostNickname: record.host_nickname,
      hostAvatarUrl: record.host_avatar_url,
      hostCountryCode: record.host_country_code,
      hostThreeDartAverage: toNumber(record.host_three_dart_average),
      alreadyRequested: Boolean(record.already_requested),
    };
  });
}

export async function requestCommunityRoomJoin(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<void> {
  if (!isUuid(roomId)) {
    throw new Error("Invalid room.");
  }

  const { error } = await supabase.rpc("request_community_room_join", {
    target_room_id: roomId,
  });
  if (error) {
    throw error;
  }
}

export async function respondCommunityRoomJoin(
  supabase: SupabaseClient<Database>,
  requestId: string,
  accept: boolean,
): Promise<CommunityRoom> {
  if (!isUuid(requestId)) {
    throw new Error("Invalid join request.");
  }

  const { data, error } = await supabase.rpc("respond_community_room_join", {
    target_request_id: requestId,
    accept_request: accept,
  });
  if (error) {
    throw error;
  }

  const room = mapRoom(data as CommunityRoomRow);
  if (!room) {
    throw new Error("Unable to update join request.");
  }
  return room;
}

export async function listCommunityRoomJoinRequests(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<CommunityJoinRequest[]> {
  if (!isUuid(roomId)) {
    return [];
  }

  // Direct select (RLS: host or requester) — avoids PostgREST RPC schema cache misses.
  const { data, error } = await supabase
    .from("community_room_join_requests")
    .select("id, room_id, requester_id, created_at")
    .eq("room_id", roomId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      rpcErrorMessage(
        error,
        "Unable to load join requests. Apply the latest Community Play migrations.",
      ),
    );
  }

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => {
      let profile: Awaited<ReturnType<typeof fetchCommunityProfile>> = null;
      try {
        profile = await fetchCommunityProfile(supabase, row.requester_id);
      } catch {
        profile = null;
      }

      return {
        requestId: row.id,
        roomId: row.room_id,
        requesterId: row.requester_id,
        createdAt: row.created_at,
        requesterDisplayName: profile?.displayName ?? null,
        requesterNickname: profile?.nickname ?? null,
        requesterAvatarUrl: profile?.avatarUrl ?? null,
        requesterCountryCode: profile?.countryCode ?? null,
        requesterThreeDartAverage: profile?.threeDartAverage ?? 0,
      };
    }),
  );
}
