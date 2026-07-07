import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  deleteActiveMatchForOwner,
  upsertActiveMatchForOwner,
} from "@/lib/supabase/queries/active-matches";
import { cancelActiveMatchCloudSync } from "@/features/match-play/lib/active-match-cloud-sync-control";
import { getActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";

export async function flushActiveMatchCloudSync(userId: string | undefined) {
  cancelActiveMatchCloudSync();

  if (!userId) {
    return;
  }

  const client = createClient();
  if (!client) {
    return;
  }

  try {
    const snapshot = getActiveMatchSnapshot(userId);

    if (!snapshot) {
      useActiveMatchCloudStore.getState().setSnapshot(null);
      await deleteActiveMatchForOwner(client, userId);
      return;
    }

    useActiveMatchCloudStore.getState().setSnapshot(snapshot);
    await upsertActiveMatchForOwner(client, userId, snapshot);
  } catch (error) {
    console.error("Failed to flush active match to Supabase", formatSupabaseError(error));
  }
}
