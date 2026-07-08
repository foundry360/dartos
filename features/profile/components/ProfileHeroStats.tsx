"use client";

import { ProfileCard } from "@/features/profile/components/ProfileCard";
import { ProfileValueGauge } from "@/features/profile/components/ProfileValueGauge";
import { ProfileAchievementIconGlyph } from "@/features/profile/components/ProfileIcons";
import {
  buildProfileCareerSnapshot,
  formatSnapshotAverage,
  formatSnapshotCount,
  formatSnapshotPercent,
} from "@/features/profile/lib/profile-snapshot";
import { averageToGaugePercent } from "@/features/profile/lib/profile-dashboard";
import { isEmptyStatValue } from "@/features/profile/lib/empty-stat-value";
import type { SessionStats } from "@/features/statistics/store/statistics-store";
import { cn } from "@/utils/cn";

interface ProfileHeroStatsProps {
  stats: SessionStats;
}

function MiniStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "target" | "trophy" | "flame";
}) {
  return (
    <div className="profile-hero-stat">
      <div className="profile-hero-stat__icon" aria-hidden>
        <ProfileAchievementIconGlyph icon={icon === "flame" ? "flame" : icon === "trophy" ? "trophy" : "target"} />
      </div>
      <div className="profile-hero-stat__copy">
        <span className="profile-hero-stat__label">{label}</span>
        <span className={cn("profile-hero-stat__value", isEmptyStatValue(value) && "stat-value--empty")}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function ProfileHeroStats({ stats }: ProfileHeroStatsProps) {
  const snapshot = buildProfileCareerSnapshot(stats);
  const threeDartAverage = snapshot.threeDartAverage;

  return (
    <ProfileCard className="profile-hero-stats">
      <div className="profile-hero-stats__gauge-wrap">
        <ProfileValueGauge
          value={formatSnapshotAverage(threeDartAverage)}
          caption="3-Dart Average"
          fillPercent={averageToGaugePercent(threeDartAverage)}
          tone="accent"
          size={176}
        />
      </div>

      <div className="profile-hero-stats__grid">
        <MiniStatCard
          label="First 9 Average"
          value={formatSnapshotAverage(snapshot.firstNineAverage)}
          icon="target"
        />
        <MiniStatCard
          label="Checkout %"
          value={formatSnapshotPercent(snapshot.checkoutPercent)}
          icon="target"
        />
        <MiniStatCard
          label="Highest Checkout"
          value={formatSnapshotCount(snapshot.highFinish)}
          icon="trophy"
        />
        <MiniStatCard
          label="180s Hit"
          value={formatSnapshotCount(stats.visits180Plus)}
          icon="flame"
        />
      </div>
    </ProfileCard>
  );
}
