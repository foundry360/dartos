import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isVoiceClipUploadConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getSupabaseServiceRoleKey(),
  );
}
