import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type ProfileClient = SupabaseClient<Database>;

export function isAccountDeactivated(
  profile: { deactivated_at?: string | null } | null | undefined,
): boolean {
  return Boolean(profile?.deactivated_at);
}

export async function fetchProfileDeactivatedAt(
  supabase: ProfileClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("deactivated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.deactivated_at ?? null;
}

export async function deactivateUserAccount(admin: ProfileClient, userId: string) {
  const deactivatedAt = new Date().toISOString();

  const { error } = await admin
    .from("profiles")
    .update({ deactivated_at: deactivatedAt })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  const { error: signOutError } = await admin.auth.admin.signOut(userId, "global");

  if (signOutError) {
    throw signOutError;
  }
}
