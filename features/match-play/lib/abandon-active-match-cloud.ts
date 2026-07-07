import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { cancelActiveMatchCloudSync } from "@/features/match-play/lib/active-match-cloud-sync-control";
import { deleteActiveMatchForOwner } from "@/lib/supabase/queries/active-matches";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { discardPendingMatchStats } from "@/features/statistics/store/pending-match-stats-store";

export async function abandonActiveMatchCloud(userId: string | undefined) {
  discardPendingMatchStats();
  cancelActiveMatchCloudSync();
  useActiveMatchCloudStore.getState().setSnapshot(null);

  if (!userId) {
    return;
  }

  const client = createClient();
  if (!client) {
    return;
  }

  try {
    await deleteActiveMatchForOwner(client, userId);
  } catch (error) {
    console.error("Failed to delete abandoned active match from Supabase", formatSupabaseError(error));
  }
}
