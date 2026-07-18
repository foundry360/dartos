import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { upsertActiveMatchForOwner } from "@/lib/supabase/queries/active-matches";
import { cancelActiveMatchCloudSync } from "@/features/match-play/lib/active-match-cloud-sync-control";
import {
  getActiveMatchSnapshots,
  mergeActiveMatchSnapshots,
} from "@/features/match-play/lib/active-match-snapshot";
import { isCloudPersistedActiveMatchId } from "@/features/match-play/lib/match-id";
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
    const liveSnapshots = getActiveMatchSnapshots(userId);
    const mergedSnapshots = mergeActiveMatchSnapshots(
      useActiveMatchCloudStore.getState().snapshots,
      liveSnapshots,
    );

    useActiveMatchCloudStore.getState().setSnapshots(mergedSnapshots);

    await Promise.all(
      mergedSnapshots
        .filter(
          (snapshot) =>
            snapshot.gameState.status === "playing" &&
            isCloudPersistedActiveMatchId(snapshot.id),
        )
        .map((snapshot) => upsertActiveMatchForOwner(client, userId, snapshot)),
    );
  } catch (error) {
    console.error("Failed to flush active match to Supabase", formatSupabaseError(error));
  }
}
