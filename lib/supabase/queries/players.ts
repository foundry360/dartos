import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SavedPlayerProfile } from "@/types/player-setup";

const PLAYER_SELECT_BASE = "id, name, nickname, color" as const;
const PLAYER_SELECT_WITH_AVATAR = "id, name, nickname, color, avatar_url" as const;

type PlayerRowBase = Pick<
  Database["public"]["Tables"]["players"]["Row"],
  "id" | "name" | "nickname" | "color"
>;

export function mapPlayerRow(
  row: PlayerRowBase & { avatar_url?: string | null },
): SavedPlayerProfile {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    color: row.color,
    avatarUrl: row.avatar_url ?? null,
  };
}

function isMissingAvatarColumnError(error: PostgrestError | null) {
  if (!error) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.code === "42703" ||
    message.includes("avatar_url") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export interface CreateSavedPlayerInput {
  ownerId: string;
  name: string;
  nickname?: string | null;
  color?: string | null;
}

export async function fetchSavedPlayers(
  supabase: SupabaseClient<Database>,
): Promise<SavedPlayerProfile[]> {
  const withAvatar = await supabase
    .from("players")
    .select(PLAYER_SELECT_WITH_AVATAR)
    .order("name", { ascending: true });

  if (!withAvatar.error) {
    return (withAvatar.data ?? []).map(mapPlayerRow);
  }

  if (!isMissingAvatarColumnError(withAvatar.error)) {
    throw withAvatar.error;
  }

  const withoutAvatar = await supabase
    .from("players")
    .select(PLAYER_SELECT_BASE)
    .order("name", { ascending: true });

  if (withoutAvatar.error) {
    throw withoutAvatar.error;
  }

  return (withoutAvatar.data ?? []).map(mapPlayerRow);
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
    .select(PLAYER_SELECT_WITH_AVATAR)
    .single();

  if (!error) {
    return mapPlayerRow(data);
  }

  if (!isMissingAvatarColumnError(error)) {
    throw error;
  }

  const fallback = await supabase
    .from("players")
    .insert({
      owner_id: input.ownerId,
      name: input.name.trim(),
      nickname: input.nickname?.trim() || null,
      color: input.color ?? null,
    })
    .select(PLAYER_SELECT_BASE)
    .single();

  if (fallback.error) {
    throw fallback.error;
  }

  return mapPlayerRow(fallback.data);
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

export { isMissingAvatarColumnError };
