"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useHeadToHeadCloudSync } from "@/features/match-play/hooks/useHeadToHeadCloudSync";
import { useMatchHistoryCloudSync } from "@/features/match-play/hooks/useMatchHistoryCloudSync";
import { useProfileCloudSync } from "@/features/profile/hooks/useProfileCloudSync";
import { useSavedPlayerStatsCloudSync } from "@/features/players/hooks/useSavedPlayerStatsCloudSync";

export function ProfileBootstrap() {
  const { user } = useAuth();
  useProfileCloudSync(user?.id);
  useSavedPlayerStatsCloudSync(user?.id);
  useHeadToHeadCloudSync(user?.id);
  useMatchHistoryCloudSync(user?.id);
  return null;
}
