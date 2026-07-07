import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DefaultMatch,
  FavoritePractice,
  PreferredGame,
  SkillLevel,
  ThrowingHand,
} from "@/types/profile";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ProfileDetailsInput {
  displayName?: string | null;
  nickname?: string | null;
  throwingHand?: ThrowingHand | null;
  skillLevel?: SkillLevel | null;
  preferredGame?: PreferredGame | null;
  homeLeague?: string | null;
  favoriteDouble?: string | null;
  favoritePractice?: FavoritePractice | null;
  defaultMatch?: DefaultMatch | null;
  preferredBoardThemeId?: string | null;
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
  voiceAnnouncementsEnabled?: boolean;
  confirmFinishTurn?: boolean;
  recentGuestNames?: string[];
}

export async function fetchProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  avatarUrl: string | null,
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileNickname(
  supabase: SupabaseClient<Database>,
  userId: string,
  nickname: string | null,
): Promise<ProfileRow> {
  return updateProfileDetails(supabase, userId, { nickname });
}

export async function updateProfileDetails(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: ProfileDetailsInput,
): Promise<ProfileRow> {
  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {};

  if ("displayName" in input) {
    payload.display_name = input.displayName?.trim() || null;
  }

  if ("nickname" in input) {
    payload.nickname = input.nickname?.trim() || null;
  }

  if ("throwingHand" in input) {
    payload.throwing_hand = input.throwingHand ?? null;
  }

  if ("skillLevel" in input) {
    payload.skill_level = input.skillLevel ?? null;
  }

  if ("preferredGame" in input) {
    payload.preferred_game = input.preferredGame ?? null;
  }

  if ("homeLeague" in input) {
    payload.home_league = input.homeLeague?.trim() || null;
  }

  if ("favoriteDouble" in input) {
    payload.favorite_double = input.favoriteDouble?.trim() || null;
  }

  if ("favoritePractice" in input) {
    payload.favorite_practice = input.favoritePractice ?? null;
  }

  if ("defaultMatch" in input) {
    payload.default_match = input.defaultMatch ?? null;
  }

  if ("preferredBoardThemeId" in input) {
    payload.preferred_board_theme_id = input.preferredBoardThemeId ?? null;
  }

  if ("hapticsEnabled" in input) {
    payload.haptics_enabled = input.hapticsEnabled ?? true;
  }

  if ("soundEnabled" in input) {
    payload.sound_enabled = input.soundEnabled ?? false;
  }

  if ("voiceAnnouncementsEnabled" in input) {
    payload.voice_announcements_enabled = input.voiceAnnouncementsEnabled ?? false;
  }

  if ("confirmFinishTurn" in input) {
    payload.confirm_finish_turn = input.confirmFinishTurn ?? false;
  }

  if ("recentGuestNames" in input) {
    payload.recent_guest_names = input.recentGuestNames ?? [];
  }

  let result = await supabase.from("profiles").update(payload).eq("id", userId).select("*").single();

  if (result.error && isMissingColumnError(result.error)) {
    const legacyPayload: Database["public"]["Tables"]["profiles"]["Update"] = {};

    if ("displayName" in input) {
      legacyPayload.display_name = input.displayName?.trim() || null;
    }

    if ("nickname" in input) {
      legacyPayload.nickname = input.nickname?.trim() || null;
    }

    result = await supabase
      .from("profiles")
      .update(legacyPayload)
      .eq("id", userId)
      .select("*")
      .single();
  }

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() ?? "";

  return (
    candidate.code === "PGRST204" ||
    candidate.code === "42703" ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

export async function uploadProfileAvatar(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
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

export async function deleteProfileAvatarFile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (listError) {
    throw listError;
  }

  if (!files?.length) {
    return;
  }

  const paths = files.map((file) => `${userId}/${file.name}`);
  const { error: removeError } = await supabase.storage.from("avatars").remove(paths);

  if (removeError) {
    throw removeError;
  }
}
