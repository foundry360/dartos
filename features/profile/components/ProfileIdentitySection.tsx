"use client";

import type { User } from "@supabase/supabase-js";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { formatCountryLabel } from "@/features/community/lib/countries";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import {
  formatMemberSince,
  formatSkillLevel,
  formatThrowingHand,
} from "@/features/profile/lib/profile-options";
import { useProfileStore } from "@/features/profile/store/profile-store";

interface ProfileIdentitySectionProps {
  user: User | null;
  displayName: string;
  onEdit: () => void;
}

export function ProfileIdentitySection({
  user,
  displayName,
  onEdit,
}: ProfileIdentitySectionProps) {
  const nickname = useProfileStore((state) => state.nickname);
  const countryCode = useProfileStore((state) => state.countryCode);
  const throwingHand = useProfileStore((state) => state.throwingHand);
  const skillLevel = useProfileStore((state) => state.skillLevel);
  const homeLeague = useProfileStore((state) => state.homeLeague);
  const memberSince = useProfileStore((state) => state.memberSince);

  const handLabel = formatThrowingHand(throwingHand);
  const levelLabel = formatSkillLevel(skillLevel);
  const countryLabel = formatCountryLabel(countryCode);
  const joinedLabel = formatMemberSince(memberSince ?? user?.created_at);
  const trailingDetails = [handLabel, levelLabel, homeLeague].filter(Boolean);

  return (
    <section className="profile-identity">
      <ProfileAvatar
        user={user}
        displayName={displayName}
        className="profile-identity__avatar"
        interactive={false}
        onEdit={onEdit}
      />

      <div className="profile-identity__copy">
        <h2 className="profile-identity__name">{displayName}</h2>
        {nickname ? <p className="profile-identity__nickname">&ldquo;{nickname}&rdquo;</p> : null}
        {joinedLabel ? (
          <span className="profile-identity__badge">Joined {joinedLabel}</span>
        ) : null}
        {countryLabel || trailingDetails.length > 0 ? (
          <p className="profile-identity__details">
            {countryLabel ? (
              <span className="profile-identity__country">
                <CountryFlag
                  countryCode={countryCode}
                  className="profile-identity__country-flag"
                  size={16}
                />
                {countryLabel}
              </span>
            ) : null}
            {countryLabel && trailingDetails.length > 0 ? " · " : null}
            {trailingDetails.join(" · ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
