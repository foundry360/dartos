"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { getHomeThreeDartAveragePreview } from "@/features/home/lib/home-header-profile-sample";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { buildProfileDashboard, formatProfileAverage } from "@/features/profile/lib/profile-stats";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";
import { useHomeGreeting } from "@/lib/home-greeting";

/** iPhone home only — avatar + greeting above the game mode grid. */
export function HomeIPhoneGreeting() {
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const stats = useStatisticsStore((state) => state.stats);
  const { allowed: canManageLeagues, loading: accessLoading } =
    useLeagueManagementAccess();
  const greeting = useHomeGreeting(user, displayName, nickname);
  const resolvedName = getUserDisplayName(user, displayName);
  const showThreeDartAverage = !accessLoading && !canManageLeagues;
  const threeDartAverage = formatProfileAverage(
    getHomeThreeDartAveragePreview(buildProfileDashboard(stats).threeDartAverage),
  );

  return (
    <div className="home-iphone-greeting">
      <ProfileAvatar
        user={user}
        displayName={resolvedName}
        className="home-iphone-greeting__avatar"
        interactive={false}
      />
      <div className="home-iphone-greeting__copy">
        <p className="home-iphone-greeting__greeting">{greeting}</p>
        {showThreeDartAverage ? (
          <p className="home-iphone-greeting__average">
            3-dart average: <span>{threeDartAverage}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
