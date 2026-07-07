"use client";

import { ProfileSection } from "@/features/profile/components/ProfileSection";
import {
  buildProfileCareerSnapshot,
  formatSnapshotAverage,
  formatSnapshotCount,
  formatSnapshotPercent,
  formatTopRecord,
  profileCareerSnapshotHasData,
} from "@/features/profile/lib/profile-snapshot";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

interface ProfileSnapshotSectionProps {
  stats: SessionStats;
}

function CareerStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-stats-section__row">
      <span className="profile-stats-section__label">{label}</span>
      <span className="profile-stats-section__value">{value}</span>
    </div>
  );
}

export function ProfileSnapshotSection({ stats }: ProfileSnapshotSectionProps) {
  const snapshot = buildProfileCareerSnapshot(stats);
  const hasData = profileCareerSnapshotHasData(stats);

  return (
    <ProfileSection title="Career Snapshot" className="profile-section--snapshot">
      <div className="profile-stats-section__list">
        <CareerStatRow
          label="3-Dart Average"
          value={formatSnapshotAverage(snapshot.threeDartAverage)}
        />
        <CareerStatRow
          label="First 9 Average"
          value={formatSnapshotAverage(snapshot.firstNineAverage)}
        />
        <CareerStatRow
          label="First 12 Average"
          value={formatSnapshotAverage(snapshot.firstTwelveAverage)}
        />
        <CareerStatRow
          label="First 15 Average"
          value={formatSnapshotAverage(snapshot.firstFifteenAverage)}
        />
        <CareerStatRow label="Checkout" value={formatSnapshotPercent(snapshot.checkoutPercent)} />
        <CareerStatRow label="High Finish" value={formatSnapshotCount(snapshot.highFinish)} />
        <CareerStatRow label="Avg Finish" value={formatSnapshotCount(snapshot.avgFinish)} />
        <CareerStatRow label="Best Game" value={formatSnapshotCount(snapshot.bestGame)} />
        <CareerStatRow label="Top Record" value={formatTopRecord(snapshot.topRecord)} />
      </div>
      {!hasData ? (
        <p className="profile-section__empty profile-section__empty--snapshot">
          Play matches to populate your career stats.
        </p>
      ) : null}
    </ProfileSection>
  );
}
