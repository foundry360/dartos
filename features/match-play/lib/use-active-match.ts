"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import {
  buildActiveMatchSummaryFromSnapshot,
  type ActiveMatchSummary,
} from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";

export type { ActiveMatchSummary };

function getPlayerNickname(profile: { nickname?: string | null; name: string }) {
  return profile.nickname?.trim() || profile.name;
}

export function useActiveMatch(): ActiveMatchSummary | null {
  const { user } = useAuth();
  const { accountProfile } = useSavedPlayerProfiles();
  const cloudSnapshot = useActiveMatchCloudStore((state) => state.snapshot);
  const cloudHydrated = useActiveMatchCloudStore((state) => state.hydrated);

  return useMemo(() => {
    if (!user || !cloudHydrated || !cloudSnapshot) {
      return null;
    }

    const accountDisplayName = accountProfile ? getPlayerNickname(accountProfile) : "You";

    return buildActiveMatchSummaryFromSnapshot(cloudSnapshot, user.id, accountDisplayName);
  }, [accountProfile, cloudHydrated, cloudSnapshot, user]);
}
