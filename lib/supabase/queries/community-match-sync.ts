import type { Database, Json } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityMatchGameMode = "x01" | "cricket";

export interface CommunityMatchStateRow {
  roomId: string;
  gameMode: CommunityMatchGameMode;
  revision: number;
  state: Record<string, unknown>;
  currentUserId: string | null;
  updatedBy: string | null;
  updatedAt: string;
  issueRaisedBy: string | null;
  issueRaisedAt: string | null;
}

type MatchStateRow = {
  room_id: string;
  game_mode: string;
  revision: number | string;
  state: Json;
  current_user_id: string | null;
  updated_by: string | null;
  updated_at: string;
  issue_raised_by?: string | null;
  issue_raised_at?: string | null;
};

function mapRow(row: MatchStateRow | null | undefined): CommunityMatchStateRow | null {
  if (!row?.room_id || (row.game_mode !== "x01" && row.game_mode !== "cricket")) {
    return null;
  }

  const state =
    row.state && typeof row.state === "object" && !Array.isArray(row.state)
      ? (row.state as Record<string, unknown>)
      : null;
  if (!state) {
    return null;
  }

  return {
    roomId: row.room_id,
    gameMode: row.game_mode,
    revision: Number(row.revision) || 0,
    state,
    currentUserId: row.current_user_id,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    issueRaisedBy: row.issue_raised_by ?? null,
    issueRaisedAt: row.issue_raised_at ?? null,
  };
}

function rpcErrorMessage(error: { message?: string }, fallback: string) {
  return error.message?.trim() || fallback;
}

export async function fetchCommunityMatchState(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<CommunityMatchStateRow | null> {
  const { data, error } = await supabase.rpc("get_community_match_state", {
    target_room_id: roomId,
  });
  if (error) {
    // No row yet — PostgREST may return null data without error.
    if (error.message?.toLowerCase().includes("null")) {
      return null;
    }
    throw new Error(rpcErrorMessage(error, "Unable to load match state."));
  }
  if (!data) {
    return null;
  }
  return mapRow(data as MatchStateRow);
}

export async function seedCommunityMatchState(
  supabase: SupabaseClient<Database>,
  input: {
    roomId: string;
    gameMode: CommunityMatchGameMode;
    state: Record<string, unknown>;
    currentUserId: string | null;
  },
): Promise<CommunityMatchStateRow> {
  const { data, error } = await supabase.rpc("seed_community_match_state", {
    target_room_id: input.roomId,
    p_game_mode: input.gameMode,
    p_state: input.state as Json,
    p_current_user_id: input.currentUserId,
  });
  if (error) {
    throw new Error(rpcErrorMessage(error, "Unable to seed match state."));
  }
  const mapped = mapRow(data as MatchStateRow);
  if (!mapped) {
    throw new Error("Unable to seed match state.");
  }
  return mapped;
}

export async function publishCommunityMatchState(
  supabase: SupabaseClient<Database>,
  input: {
    roomId: string;
    expectedRevision: number;
    state: Record<string, unknown>;
    currentUserId: string | null;
  },
): Promise<CommunityMatchStateRow> {
  const { data, error } = await supabase.rpc("publish_community_match_state", {
    target_room_id: input.roomId,
    expected_revision: input.expectedRevision,
    p_state: input.state as Json,
    p_current_user_id: input.currentUserId,
  });
  if (error) {
    throw new Error(rpcErrorMessage(error, "Unable to sync match state."));
  }
  const mapped = mapRow(data as MatchStateRow);
  if (!mapped) {
    throw new Error("Unable to sync match state.");
  }
  return mapped;
}

export async function raiseCommunityMatchIssue(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<CommunityMatchStateRow> {
  const { data, error } = await supabase.rpc("raise_community_match_issue", {
    target_room_id: roomId,
  });
  if (error) {
    throw new Error(rpcErrorMessage(error, "Unable to raise score issue."));
  }
  const mapped = mapRow(data as MatchStateRow);
  if (!mapped) {
    throw new Error("Unable to raise score issue.");
  }
  return mapped;
}

export async function clearCommunityMatchIssue(
  supabase: SupabaseClient<Database>,
  roomId: string,
): Promise<CommunityMatchStateRow> {
  const { data, error } = await supabase.rpc("clear_community_match_issue", {
    target_room_id: roomId,
  });
  if (error) {
    throw new Error(rpcErrorMessage(error, "Unable to clear score issue."));
  }
  const mapped = mapRow(data as MatchStateRow);
  if (!mapped) {
    throw new Error("Unable to clear score issue.");
  }
  return mapped;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Resolve whose turn it is for Community sync.
 * Engine player ids are `player-0` / `player-1`, so pass auth user ids
 * ordered by engine index (seat 0, seat 1, …).
 */
export function currentUserIdFromGameState(
  state: Record<string, unknown> | null | undefined,
  playerUserIds?: Array<string | null | undefined>,
): string | null {
  if (!state) {
    return null;
  }
  const status = state.status;
  if (status === "finished") {
    return null;
  }
  const index = state.currentPlayerIndex;
  if (typeof index !== "number" || index < 0) {
    return null;
  }

  const mapped = playerUserIds?.[index];
  if (typeof mapped === "string" && isUuid(mapped)) {
    return mapped;
  }

  const players = state.players;
  if (!Array.isArray(players)) {
    return null;
  }
  const player = players[index] as { id?: unknown } | undefined;
  return typeof player?.id === "string" && isUuid(player.id) ? player.id : null;
}
