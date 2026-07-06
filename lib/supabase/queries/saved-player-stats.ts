import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionStats } from "@/features/statistics/store/statistics-store";
import type { Database } from "@/lib/supabase/database.types";
import {
  mapPlayerStatsRow,
  mapSessionStatsToRow,
} from "@/lib/supabase/queries/player-stats";

export type SavedPlayerStatsRow = Database["public"]["Tables"]["saved_player_stats"]["Row"];

function mapSavedPlayerStatsRow(row: SavedPlayerStatsRow): SessionStats {
  return mapPlayerStatsRow({
    ...row,
    user_id: row.player_id,
  });
}

function mapSessionStatsToSavedPlayerRow(playerId: string, stats: SessionStats) {
  const { user_id: _userId, ...rest } = mapSessionStatsToRow(playerId, stats);

  return {
    player_id: playerId,
    ...rest,
  };
}

export async function fetchSavedPlayerStats(
  supabase: SupabaseClient<Database>,
  playerId: string,
): Promise<SessionStats | null> {
  const { data, error } = await supabase
    .from("saved_player_stats")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSavedPlayerStatsRow(data) : null;
}

export async function fetchSavedPlayerStatsForOwner(
  supabase: SupabaseClient<Database>,
): Promise<Record<string, SessionStats>> {
  const { data: players, error: playersError } = await supabase.from("players").select("id");

  if (playersError) {
    throw playersError;
  }

  const playerIds = (players ?? []).map((player) => player.id);

  if (playerIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("saved_player_stats")
    .select("*")
    .in("player_id", playerIds);

  if (error) {
    throw error;
  }

  const statsByProfileId: Record<string, SessionStats> = {};

  for (const row of data ?? []) {
    statsByProfileId[row.player_id] = mapSavedPlayerStatsRow(row);
  }

  return statsByProfileId;
}

export async function upsertSavedPlayerStats(
  supabase: SupabaseClient<Database>,
  playerId: string,
  stats: SessionStats,
): Promise<SessionStats> {
  const { data, error } = await supabase
    .from("saved_player_stats")
    .upsert(mapSessionStatsToSavedPlayerRow(playerId, stats), { onConflict: "player_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapSavedPlayerStatsRow(data);
}
