"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  NotificationsBellButton,
  NotificationsPanel,
} from "@/features/notifications/components/NotificationsPanel";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { getHomeThreeDartAveragePreview } from "@/features/home/lib/home-header-profile-sample";
import { buildProfileDashboard, formatProfileAverage } from "@/features/profile/lib/profile-stats";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";
import { buildHomeGreeting } from "@/lib/home-greeting";

export function HomeHeaderProfile() {
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const stats = useStatisticsStore((state) => state.stats);
  const greeting = buildHomeGreeting(user, displayName, nickname);
  const resolvedName = getUserDisplayName(user, displayName);
  const threeDartAverage = formatProfileAverage(
    getHomeThreeDartAveragePreview(buildProfileDashboard(stats).threeDartAverage),
  );

  return (
    <div className="home-header-profile">
      <div className="home-header-profile__copy">
        <p className="home-header-profile__greeting">{greeting}</p>
        <p className="home-header-profile__average">
          3-dart average: <span>{threeDartAverage}</span>
        </p>
      </div>

      <NotificationsBellButton />
      <NotificationsPanel />

      <ProfileAvatar
        user={user}
        displayName={resolvedName}
        className="home-header-profile__avatar"
        interactive={false}
      />
    </div>
  );
}
