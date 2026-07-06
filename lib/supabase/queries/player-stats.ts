import type { SessionStats } from "@/features/statistics/store/statistics-store";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlayerStatsRow = Database["public"]["Tables"]["player_stats"]["Row"];

export function mapPlayerStatsRow(row: PlayerStatsRow): SessionStats {
  return {
    dartsThrown: row.darts_thrown,
    totalScore: row.total_score,
    visits: row.visits,
    highestVisit: row.highest_visit,
    visits100Plus: row.visits100_plus,
    visits140Plus: row.visits140_plus,
    firstNineScore: row.first_nine_score,
    firstNineVisits: row.first_nine_visits,
    singlesHit: row.singles_hit,
    doublesHit: row.doubles_hit,
    triplesHit: row.triples_hit,
    bullHit: row.bull_hit,
    checkoutAttempts: row.checkout_attempts,
    checkoutSuccesses: row.checkout_successes,
    matchesPlayed: row.matches_played,
    matchesWon: row.matches_won,
    legsPlayed: row.legs_played,
    legsWon: row.legs_won,
    breaksOfThrow: row.breaks_of_throw,
  };
}

export function mapSessionStatsToRow(userId: string, stats: SessionStats) {
  return {
    user_id: userId,
    darts_thrown: stats.dartsThrown,
    total_score: stats.totalScore,
    visits: stats.visits,
    highest_visit: stats.highestVisit,
    visits100_plus: stats.visits100Plus,
    visits140_plus: stats.visits140Plus,
    first_nine_score: stats.firstNineScore,
    first_nine_visits: stats.firstNineVisits,
    singles_hit: stats.singlesHit,
    doubles_hit: stats.doublesHit,
    triples_hit: stats.triplesHit,
    bull_hit: stats.bullHit,
    checkout_attempts: stats.checkoutAttempts,
    checkout_successes: stats.checkoutSuccesses,
    matches_played: stats.matchesPlayed,
    matches_won: stats.matchesWon,
    legs_played: stats.legsPlayed,
    legs_won: stats.legsWon,
    breaks_of_throw: stats.breaksOfThrow,
  };
}

export async function fetchPlayerStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SessionStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPlayerStatsRow(data) : null;
}

export async function upsertPlayerStats(
  supabase: SupabaseClient<Database>,
  userId: string,
  stats: SessionStats,
): Promise<SessionStats> {
  const { data, error } = await supabase
    .from("player_stats")
    .upsert(mapSessionStatsToRow(userId, stats), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapPlayerStatsRow(data);
}

export function pickAuthoritativeStats(
  local: SessionStats,
  remote: SessionStats | null,
): SessionStats {
  if (!remote) {
    return local;
  }

  if (local.dartsThrown > remote.dartsThrown) {
    return local;
  }

  return remote;
}
