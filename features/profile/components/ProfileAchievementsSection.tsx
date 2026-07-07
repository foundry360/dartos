"use client";

import { ProfileSection } from "@/features/profile/components/ProfileSection";
import { ProfileAchievementIconGlyph } from "@/features/profile/components/ProfileIcons";
import { buildProfileAchievements } from "@/features/profile/lib/profile-achievements";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import type { SessionStats } from "@/features/statistics/store/statistics-store";
import { cn } from "@/utils/cn";

interface ProfileAchievementsSectionProps {
  stats: SessionStats;
  matches: MatchHistoryEntry[];
}

export function ProfileAchievementsSection({ stats, matches }: ProfileAchievementsSectionProps) {
  const achievements = buildProfileAchievements(stats, matches);

  return (
    <ProfileSection title="Achievements" className="profile-section--achievements">
      <div className="profile-achievement-row">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={cn(
              "profile-achievement-microcard",
              !achievement.unlocked && "profile-achievement-microcard--locked",
            )}
            title={achievement.description}
            aria-label={`${achievement.title}. ${achievement.description}${
              achievement.unlocked ? "" : " Locked."
            }`}
          >
            <span className="profile-achievement-microcard__icon" aria-hidden>
              <ProfileAchievementIconGlyph icon={achievement.icon} />
            </span>
            <p className="profile-achievement-microcard__title">{achievement.title}</p>
          </div>
        ))}
      </div>
    </ProfileSection>
  );
}
