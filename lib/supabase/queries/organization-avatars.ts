import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OrganizationRow } from "@/lib/supabase/database.types";

export async function uploadOrganizationAvatar(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  organizationId: string,
  file: File,
): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ownerId}/venues/${organizationId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Bust CDN/browser cache when replacing an avatar at the same path.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function updateOrganizationLogoUrl(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  logoUrl: string | null,
): Promise<OrganizationRow> {
  const { data, error } = await supabase
    .from("organizations")
    .update({ logo_url: logoUrl })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteOrganizationAvatarFiles(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  organizationId: string,
): Promise<void> {
  const folder = `${ownerId}/venues/${organizationId}`;
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
