"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import {
  buildActiveMatchSummaryFromSnapshot,
  sortActiveMatchSnapshots,
  type ActiveMatchSummary,
} from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";

export type { ActiveMatchSummary };

function getPlayerNickname(profile: { nickname?: string | null; name: string }) {
  return profile.nickname?.trim() || profile.name;
}

function buildSummaries(
  snapshots: ReturnType<typeof useActiveMatchCloudStore.getState>["snapshots"],
  userId: string,
  accountDisplayName: string,
): ActiveMatchSummary[] {
  return sortActiveMatchSnapshots(snapshots)
    .map((snapshot) => buildActiveMatchSummaryFromSnapshot(snapshot, userId, accountDisplayName))
    .filter((summary): summary is ActiveMatchSummary => summary !== null);
}

export function useActiveMatches(): ActiveMatchSummary[] {
  const { user } = useAuth();
  const { accountProfile } = useSavedPlayerProfiles();
  const snapshots = useActiveMatchCloudStore((state) => state.snapshots);
  const cloudHydrated = useActiveMatchCloudStore((state) => state.hydrated);

  return useMemo(() => {
    if (!user || !cloudHydrated || snapshots.length === 0) {
      return [];
    }

    const accountDisplayName = accountProfile ? getPlayerNickname(accountProfile) : "You";

    return buildSummaries(snapshots, user.id, accountDisplayName);
  }, [accountProfile, cloudHydrated, snapshots, user]);
}

export function useMostRecentActiveMatch(): ActiveMatchSummary | null {
  const matches = useActiveMatches();
  return matches[0] ?? null;
}

/** @deprecated Use useMostRecentActiveMatch on home and useActiveMatches on Matches. */
export function useActiveMatch(): ActiveMatchSummary | null {
  return useMostRecentActiveMatch();
}
