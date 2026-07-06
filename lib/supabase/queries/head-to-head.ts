import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isMissingRelationError } from "@/lib/supabase/errors";

export type HeadToHeadRow = Database["public"]["Tables"]["player_head_to_head"]["Row"];

export interface HeadToHeadRecord {
  opponentId: string;
  userWins: number;
  opponentWins: number;
}

function mapHeadToHeadRow(row: HeadToHeadRow): HeadToHeadRecord {
  return {
    opponentId: row.opponent_id,
    userWins: row.user_wins,
    opponentWins: row.opponent_wins,
  };
}

export async function fetchHeadToHeadForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<HeadToHeadRecord[]> {
  const { data, error } = await supabase
    .from("player_head_to_head")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }

    throw error;
  }

  return (data ?? []).map(mapHeadToHeadRow);
}

export async function upsertHeadToHeadRecord(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  record: HeadToHeadRecord,
): Promise<HeadToHeadRecord | null> {
  const { data, error } = await supabase
    .from("player_head_to_head")
    .upsert(
      {
        owner_id: ownerId,
        opponent_id: record.opponentId,
        user_wins: record.userWins,
        opponent_wins: record.opponentWins,
      },
      { onConflict: "owner_id,opponent_id" },
    )
    .select("*")
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }

    throw error;
  }

  return mapHeadToHeadRow(data);
}
