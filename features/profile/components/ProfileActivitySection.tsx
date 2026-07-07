"use client";

import { ProfileSection } from "@/features/profile/components/ProfileSection";
import { ProfileActivityIconGlyph } from "@/features/profile/components/ProfileIcons";
import { buildProfileActivityFeed } from "@/features/profile/lib/profile-activity";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { SavedPlayerProfile } from "@/types/player-setup";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

interface ProfileActivitySectionProps {
  stats: SessionStats;
  matches: MatchHistoryEntry[];
  opponents: SavedPlayerProfile[];
}

export function ProfileActivitySection({
  stats,
  matches,
  opponents,
}: ProfileActivitySectionProps) {
  const activity = buildProfileActivityFeed(matches, opponents, stats);

  return (
    <ProfileSection title="Recent Activity">
      {activity.length > 0 ? (
        <div className="profile-activity-list">
          {activity.map((item) => (
            <div key={item.id} className="profile-activity-row">
              <span className="profile-activity-row__icon" aria-hidden>
                <ProfileActivityIconGlyph icon={item.icon} />
              </span>
              <div className="profile-activity-row__copy">
                <p className="profile-activity-row__title">{item.title}</p>
                <p className="profile-activity-row__subtitle">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="profile-section__empty">
          Match results and milestones will show up here as you play.
        </p>
      )}
    </ProfileSection>
  );
}
