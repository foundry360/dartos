import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { PracticeSessionHistoryEntry } from "@/types/practice-stats";

export type PracticeSessionHistoryRow =
  Database["public"]["Tables"]["practice_session_history"]["Row"];

function mapPracticeSessionHistoryRow(row: PracticeSessionHistoryRow): PracticeSessionHistoryEntry {
  return {
    id: row.id,
    drillId: row.drill_id,
    drillTitle: row.drill_title,
    config: (row.config as Record<string, unknown>) ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
    dartsThrown: row.darts_thrown,
    successes: row.successes,
    attempts: row.attempts,
    durationSeconds: row.duration_seconds,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export async function fetchPracticeSessionHistoryForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<PracticeSessionHistoryEntry[]> {
  const { data, error } = await supabase
    .from("practice_session_history")
    .select("*")
    .eq("owner_id", ownerId)
    .order("completed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPracticeSessionHistoryRow);
}

export async function insertPracticeSessionHistoryEntry(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  entry: PracticeSessionHistoryEntry,
): Promise<PracticeSessionHistoryEntry> {
  const { data, error } = await supabase
    .from("practice_session_history")
    .insert({
      id: entry.id,
      owner_id: ownerId,
      drill_id: entry.drillId,
      drill_title: entry.drillTitle,
      config: entry.config as Database["public"]["Tables"]["practice_session_history"]["Insert"]["config"],
      started_at: entry.startedAt,
      completed_at: entry.completedAt,
      darts_thrown: entry.dartsThrown,
      successes: entry.successes,
      attempts: entry.attempts,
      duration_seconds: entry.durationSeconds,
      metadata: entry.metadata as Database["public"]["Tables"]["practice_session_history"]["Insert"]["metadata"],
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapPracticeSessionHistoryRow(data);
}
