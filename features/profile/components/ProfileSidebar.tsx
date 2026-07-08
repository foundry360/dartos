"use client";

import type { User } from "@supabase/supabase-js";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileAchievementIconGlyph } from "@/features/profile/components/ProfileIcons";
import { buildProfileAchievements } from "@/features/profile/lib/profile-achievements";
import {
  formatProfileNickname,
  formatProfileRank,
  formatWinRate,
  getQuickStats,
  getRecentMatchForm,
} from "@/features/profile/lib/profile-dashboard";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import { useProfileStore } from "@/features/profile/store/profile-store";
import type { SessionStats } from "@/features/statistics/store/statistics-store";
import { isEmptyStatValue } from "@/features/profile/lib/empty-stat-value";
import { cn } from "@/utils/cn";

interface ProfileSidebarProps {
  user: User | null;
  displayName: string;
  stats: SessionStats;
  matches: MatchHistoryEntry[];
  onEdit: () => void;
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="profile-sidebar__location-icon">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="11" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function ProfileSidebar({
  user,
  displayName,
  stats,
  matches,
  onEdit,
}: ProfileSidebarProps) {
  const nickname = useProfileStore((state) => state.nickname);
  const skillLevel = useProfileStore((state) => state.skillLevel);
  const homeLeague = useProfileStore((state) => state.homeLeague);
  const rankLabel = formatProfileRank(skillLevel);
  const nicknameLabel = formatProfileNickname(nickname);
  const quickStats = getQuickStats(stats);
  const recentForm = getRecentMatchForm(matches);
  const unlockedBadges = buildProfileAchievements(stats, matches).filter(
    (achievement) => achievement.unlocked,
  );

  return (
    <aside className="profile-sidebar">
      <ProfileCard className="profile-sidebar__identity">
        <ProfileAvatar
          user={user}
          displayName={displayName}
          className="profile-sidebar__avatar"
          interactive={false}
        />

        <div className="profile-sidebar__identity-copy">
          <h2 className="profile-sidebar__name">{displayName.toUpperCase()}</h2>
          {nicknameLabel ? (
            <p className="profile-sidebar__nickname">{nicknameLabel}</p>
          ) : null}
          {rankLabel ? <span className="profile-sidebar__rank">{rankLabel}</span> : null}
          {homeLeague ? (
            <p className="profile-sidebar__location">
              <LocationIcon />
              <span>{homeLeague}</span>
            </p>
          ) : null}
          <button type="button" className="profile-sidebar__edit" onClick={onEdit}>
            Edit Profile
          </button>
        </div>

        <div className="profile-sidebar__quick-stats">
          <div className="profile-sidebar__quick-stat">
            <span
              className={cn(
                "profile-sidebar__quick-stat-value",
                quickStats.played <= 0 && "stat-value--empty",
              )}
            >
              {quickStats.played > 0 ? quickStats.played : "—"}
            </span>
            <span className="profile-sidebar__quick-stat-label">Played</span>
          </div>
          <div className="profile-sidebar__quick-stat">
            <span
              className={cn(
                "profile-sidebar__quick-stat-value",
                quickStats.won <= 0 && "stat-value--empty",
              )}
            >
              {quickStats.won > 0 ? quickStats.won : "—"}
            </span>
            <span className="profile-sidebar__quick-stat-label">Won</span>
          </div>
          <div className="profile-sidebar__quick-stat">
            <span
              className={cn(
                "profile-sidebar__quick-stat-value",
                isEmptyStatValue(formatWinRate(quickStats.winRate)) && "stat-value--empty",
              )}
            >
              {formatWinRate(quickStats.winRate)}
            </span>
            <span className="profile-sidebar__quick-stat-label">Win %</span>
          </div>
        </div>
      </ProfileCard>

      <ProfileCard>
        <h3 className="profile-sidebar__section-title">Recent Form</h3>
        {recentForm.length > 0 ? (
          <div className="profile-sidebar__form-row">
            {recentForm.map((won, index) => (
              <span
                key={`${won ? "w" : "l"}-${index}`}
                className={cn(
                  "profile-sidebar__form-chip",
                  won ? "profile-sidebar__form-chip--win" : "profile-sidebar__form-chip--loss",
                )}
              >
                {won ? "W" : "L"}
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-sidebar__empty">Play matches to track form.</p>
        )}
      </ProfileCard>

      <ProfileCard>
        <h3 className="profile-sidebar__section-title">Badges</h3>
        {unlockedBadges.length > 0 ? (
          <ul className="profile-sidebar__badge-list">
            {unlockedBadges.map((badge) => (
              <li key={badge.id} className="profile-sidebar__badge-item">
                <span className="profile-sidebar__badge-icon" aria-hidden>
                  <ProfileAchievementIconGlyph icon={badge.icon} />
                </span>
                <span className="profile-sidebar__badge-label">{badge.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="profile-sidebar__empty">Earn badges as you hit milestones.</p>
        )}
      </ProfileCard>
    </aside>
  );
}
