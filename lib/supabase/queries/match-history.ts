import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";

export type MatchHistoryRow = Database["public"]["Tables"]["player_match_history"]["Row"];

function mapMatchHistoryRow(row: MatchHistoryRow): MatchHistoryEntry {
  return {
    id: row.id,
    opponentId: row.opponent_id,
    userWon: row.user_won,
    matchType: row.match_type,
    userLegs: row.user_legs ?? 0,
    opponentLegs: row.opponent_legs ?? 0,
    playedAt: row.played_at,
  };
}

export async function fetchMatchHistoryForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<MatchHistoryEntry[]> {
  const { data, error } = await supabase
    .from("player_match_history")
    .select("*")
    .eq("owner_id", ownerId)
    .order("played_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchHistoryRow);
}

export async function insertMatchHistoryEntry(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  entry: MatchHistoryEntry,
): Promise<MatchHistoryEntry> {
  const { data, error } = await supabase
    .from("player_match_history")
    .insert({
      id: entry.id,
      owner_id: ownerId,
      opponent_id: entry.opponentId,
      user_won: entry.userWon,
      match_type: entry.matchType,
      user_legs: entry.userLegs,
      opponent_legs: entry.opponentLegs,
      played_at: entry.playedAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapMatchHistoryRow(data);
}
