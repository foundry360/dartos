import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function userIsTrialEligible(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    return false;
  }

  return (count ?? 0) === 0;
}
