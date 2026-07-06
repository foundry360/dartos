"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useProfileCloudSync } from "@/features/profile/hooks/useProfileCloudSync";
import { useSavedPlayerStatsCloudSync } from "@/features/players/hooks/useSavedPlayerStatsCloudSync";

export function ProfileBootstrap() {
  const { user } = useAuth();
  useProfileCloudSync(user?.id);
  useSavedPlayerStatsCloudSync(user?.id);
  return null;
}
