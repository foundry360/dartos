"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";
import { buildHomeGreeting } from "@/lib/home-greeting";

/** Home-style name + avatar for League Management (no average / notifications). */
export function LeagueHeaderProfile() {
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const greeting = buildHomeGreeting(user, displayName, nickname);
  const resolvedName = getUserDisplayName(user, displayName);

  return (
    <div className="home-header-profile">
      <div className="home-header-profile__copy">
        <p className="home-header-profile__greeting">{greeting}</p>
      </div>

      <ProfileAvatar
        user={user}
        displayName={resolvedName}
        className="home-header-profile__avatar"
        interactive={false}
      />
    </div>
  );
}
