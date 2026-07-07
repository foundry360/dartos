import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import type { Database, Json } from "@/lib/supabase/database.types";

export type ActiveMatchRow = Database["public"]["Tables"]["player_active_matches"]["Row"];

function mapActiveMatchRow(row: ActiveMatchRow): ActiveMatchSnapshot {
  return {
    gameMode: row.game_mode,
    resumeHref: row.resume_href,
    matchType: row.match_type,
    opponentId: row.opponent_id,
    opponentName: row.opponent_name,
    progress: row.progress,
    gameState: row.game_state as unknown as ActiveMatchSnapshot["gameState"],
  };
}

export async function fetchActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<ActiveMatchSnapshot | null> {
  const { data, error } = await supabase
    .from("player_active_matches")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapActiveMatchRow(data) : null;
}

export async function upsertActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  snapshot: ActiveMatchSnapshot,
): Promise<void> {
  const { error } = await supabase.from("player_active_matches").upsert(
    {
      owner_id: ownerId,
      game_mode: snapshot.gameMode,
      resume_href: snapshot.resumeHref,
      match_type: snapshot.matchType,
      opponent_id: snapshot.opponentId,
      opponent_name: snapshot.opponentName,
      progress: snapshot.progress,
      game_state: snapshot.gameState as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    throw error;
  }
}

export async function deleteActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase.from("player_active_matches").delete().eq("owner_id", ownerId);

  if (error) {
    throw error;
  }
}
