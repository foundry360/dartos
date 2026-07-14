"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useActiveMatchCloudSync } from "@/features/match-play/hooks/useActiveMatchCloudSync";
import { useHeadToHeadCloudSync } from "@/features/match-play/hooks/useHeadToHeadCloudSync";
import { useMatchHistoryCloudSync } from "@/features/match-play/hooks/useMatchHistoryCloudSync";
import { useProfileCloudSync } from "@/features/profile/hooks/useProfileCloudSync";
import { useUserPreferencesCloudSync } from "@/features/profile/hooks/useUserPreferencesCloudSync";
import { useSavedPlayerStatsCloudSync } from "@/features/players/hooks/useSavedPlayerStatsCloudSync";
import { usePracticeStatsCloudSync } from "@/features/practice/hooks/usePracticeStatsCloudSync";
import { useNotificationsSync } from "@/features/notifications/hooks/useNotificationsSync";
import { useSettingsSessionHydration } from "@/features/settings/hooks/useSettingsSessionHydration";
import { isPublicPath } from "@/lib/auth/routes";

export function ProfileBootstrap() {
  const pathname = usePathname();
  const isPublicRoute = isPublicPath(pathname);

  if (isPublicRoute) {
    return null;
  }

  return <ProfileBootstrapApp />;
}

function ProfileBootstrapApp() {
  const { user, loading } = useAuth();
  useSettingsSessionHydration();
  useProfileCloudSync(user?.id);
  useUserPreferencesCloudSync(user?.id, loading);
  useNotificationsSync(user?.id, loading);
  useSavedPlayerStatsCloudSync(user?.id);
  usePracticeStatsCloudSync(user?.id, loading);
  useActiveMatchCloudSync(user?.id, loading);
  useHeadToHeadCloudSync(user?.id, loading);
  useMatchHistoryCloudSync(user?.id, loading);
  return null;
}
