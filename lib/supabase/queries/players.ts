import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SavedPlayerProfile } from "@/types/player-setup";

export interface CreateSavedPlayerInput {
  ownerId: string;
  name: string;
  nickname?: string | null;
  color?: string | null;
}

export interface UpdateSavedPlayerInput {
  name?: string;
  nickname?: string | null;
  color?: string | null;
}

export async function fetchSavedPlayers(
  supabase: SupabaseClient<Database>,
): Promise<SavedPlayerProfile[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, nickname, color")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createSavedPlayer(
  supabase: SupabaseClient<Database>,
  input: CreateSavedPlayerInput,
): Promise<SavedPlayerProfile> {
  const { data, error } = await supabase
    .from("players")
    .insert({
      owner_id: input.ownerId,
      name: input.name.trim(),
      nickname: input.nickname?.trim() || null,
      color: input.color ?? null,
    })
    .select("id, name, nickname, color")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteSavedPlayer(
  supabase: SupabaseClient<Database>,
  playerId: string,
): Promise<void> {
  const { error } = await supabase.from("players").delete().eq("id", playerId);

  if (error) {
    throw error;
  }
}
