import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SavedPlayerProfile } from "@/types/player-setup";
import { mapPlayerRow, isMissingAvatarColumnError } from "@/lib/supabase/queries/players";

export async function uploadSavedPlayerAvatar(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  playerId: string,
  file: File,
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ownerId}/players/${playerId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateSavedPlayerAvatarUrl(
  supabase: SupabaseClient<Database>,
  playerId: string,
  avatarUrl: string | null,
): Promise<SavedPlayerProfile> {
  const { data, error } = await supabase
    .from("players")
    .update({ avatar_url: avatarUrl })
    .eq("id", playerId)
    .select("id, name, nickname, color, avatar_url")
    .single();

  if (error) {
    if (isMissingAvatarColumnError(error)) {
      throw new Error("Saved player avatars require a database update. Run the latest migration.");
    }

    throw error;
  }

  return mapPlayerRow(data);
}

export async function deleteSavedPlayerAvatarFiles(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  playerId: string,
): Promise<void> {
  const folder = `${ownerId}/players/${playerId}`;
  const { data: files, error: listError } = await supabase.storage.from("avatars").list(folder);

  if (listError) {
    throw listError;
  }

  if (!files?.length) {
    return;
  }

  const paths = files.map((file) => `${folder}/${file.name}`);
  const { error: removeError } = await supabase.storage.from("avatars").remove(paths);

  if (removeError) {
    throw removeError;
  }
}
