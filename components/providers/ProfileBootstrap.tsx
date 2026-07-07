"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useActiveMatchCloudSync } from "@/features/match-play/hooks/useActiveMatchCloudSync";
import { useHeadToHeadCloudSync } from "@/features/match-play/hooks/useHeadToHeadCloudSync";
import { useMatchHistoryCloudSync } from "@/features/match-play/hooks/useMatchHistoryCloudSync";
import { useProfileCloudSync } from "@/features/profile/hooks/useProfileCloudSync";
import { useUserPreferencesCloudSync } from "@/features/profile/hooks/useUserPreferencesCloudSync";
import { useSavedPlayerStatsCloudSync } from "@/features/players/hooks/useSavedPlayerStatsCloudSync";

export function ProfileBootstrap() {
  const { user, loading } = useAuth();
  useProfileCloudSync(user?.id);
  useUserPreferencesCloudSync(user?.id, loading);
  useSavedPlayerStatsCloudSync(user?.id);
  useActiveMatchCloudSync(user?.id, loading);
  useHeadToHeadCloudSync(user?.id, loading);
  useMatchHistoryCloudSync(user?.id, loading);
  return null;
}
