"use client";

import {
  ProfileMetaRow,
  ProfileSection,
} from "@/features/profile/components/ProfileSection";
import {
  formatDefaultMatch,
  formatFavoritePractice,
  formatPreferredGame,
} from "@/features/profile/lib/profile-options";
import { useProfileStore } from "@/features/profile/store/profile-store";

export function ProfilePreferencesSection() {
  const preferredGame = useProfileStore((state) => state.preferredGame);
  const favoriteDouble = useProfileStore((state) => state.favoriteDouble);
  const favoritePractice = useProfileStore((state) => state.favoritePractice);
  const defaultMatch = useProfileStore((state) => state.defaultMatch);

  const favoriteGameLabel = formatPreferredGame(preferredGame);
  const favoritePracticeLabel = formatFavoritePractice(favoritePractice);
  const defaultMatchLabel = formatDefaultMatch(defaultMatch);

  const hasPreferences =
    favoriteGameLabel || favoriteDouble || favoritePracticeLabel || defaultMatchLabel;

  return (
    <ProfileSection title="Preferences">
      {hasPreferences ? (
        <div className="profile-meta-list">
          <ProfileMetaRow label="Favorite Game" value={favoriteGameLabel} />
          <ProfileMetaRow label="Favorite Double" value={favoriteDouble} />
          <ProfileMetaRow label="Favorite Practice" value={favoritePracticeLabel} />
          <ProfileMetaRow label="Default Match" value={defaultMatchLabel} />
        </div>
      ) : (
        <p className="profile-section__empty">
          Set your favorite game, double, and practice routine in Edit Profile.
        </p>
      )}
    </ProfileSection>
  );
}
