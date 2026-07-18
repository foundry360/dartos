import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import {
  parseStoredActiveMatchGameState,
  serializeActiveMatchGameState,
  sortActiveMatchSnapshots,
} from "@/features/match-play/lib/active-match-snapshot";
import { isCloudPersistedActiveMatchId } from "@/features/match-play/lib/match-id";
import type { Database, Json } from "@/lib/supabase/database.types";

export type ActiveMatchRow = Database["public"]["Tables"]["player_active_matches"]["Row"];

function mapActiveMatchRow(row: ActiveMatchRow): ActiveMatchSnapshot {
  const gameState = parseStoredActiveMatchGameState(row.game_state);
  const matchId = row.id ?? gameState.matchId ?? row.owner_id;

  return {
    id: matchId,
    gameMode: row.game_mode,
    resumeHref: row.resume_href,
    matchType: row.match_type,
    opponentId: row.opponent_id,
    opponentName: row.opponent_name,
    progress: row.progress,
    updatedAt: row.updated_at,
    gameState: {
      ...gameState,
      matchId,
    },
  };
}

export async function fetchActiveMatchesForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<ActiveMatchSnapshot[]> {
  const { data, error } = await supabase
    .from("player_active_matches")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return sortActiveMatchSnapshots((data ?? []).map(mapActiveMatchRow)).filter(
    (snapshot) => snapshot.gameState.status === "playing",
  );
}

/** @deprecated Use fetchActiveMatchesForOwner instead. */
export async function fetchActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<ActiveMatchSnapshot | null> {
  const matches = await fetchActiveMatchesForOwner(supabase, ownerId);
  return matches[0] ?? null;
}

export async function upsertActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  snapshot: ActiveMatchSnapshot,
): Promise<void> {
  // League Pro uses composite engine ids (`league:…`) that are not uuids.
  if (!isCloudPersistedActiveMatchId(snapshot.id)) {
    return;
  }

  const { error } = await supabase.from("player_active_matches").upsert(
    {
      id: snapshot.id,
      owner_id: ownerId,
      game_mode: snapshot.gameMode,
      resume_href: snapshot.resumeHref,
      match_type: snapshot.matchType,
      opponent_id: snapshot.opponentId,
      opponent_name: snapshot.opponentName,
      progress: snapshot.progress,
      game_state: serializeActiveMatchGameState(snapshot) as unknown as Json,
      updated_at: snapshot.updatedAt,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function deleteActiveMatchForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  matchId: string,
): Promise<void> {
  if (!isCloudPersistedActiveMatchId(matchId)) {
    return;
  }

  const { error } = await supabase
    .from("player_active_matches")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", matchId);

  if (error) {
    throw error;
  }
}

/** @deprecated Deletes every active match for the owner. Prefer deleteActiveMatchForOwner. */
export async function deleteAllActiveMatchesForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
): Promise<void> {
  const { error } = await supabase
    .from("player_active_matches")
    .delete()
    .eq("owner_id", ownerId);

  if (error) {
    throw error;
  }
}
