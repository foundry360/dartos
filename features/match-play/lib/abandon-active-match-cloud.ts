import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  deleteActiveMatchForOwner,
  upsertActiveMatchForOwner,
} from "@/lib/supabase/queries/active-matches";
import { cancelActiveMatchCloudSync } from "@/features/match-play/lib/active-match-cloud-sync-control";
import {
  getActiveMatchSnapshots,
  mergeActiveMatchSnapshots,
} from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { discardPendingMatchStats } from "@/features/statistics/store/pending-match-stats-store";

export async function abandonActiveMatchCloud(
  userId: string | undefined,
  matchId: string | undefined,
) {
  discardPendingMatchStats();
  cancelActiveMatchCloudSync();

  if (matchId) {
    useActiveMatchCloudStore.getState().removeSnapshot(matchId);
  }

  if (!userId || !matchId) {
    return;
  }

  const client = createClient();
  if (!client) {
    return;
  }

  try {
    await deleteActiveMatchForOwner(client, userId, matchId);
  } catch (error) {
    console.error(
      "Failed to delete abandoned active match from Supabase",
      formatSupabaseError(error),
    );
  }
}
