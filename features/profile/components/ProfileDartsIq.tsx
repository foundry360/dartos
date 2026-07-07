"use client";

import Link from "next/link";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import { ProfileValueGauge } from "@/features/profile/components/ProfileValueGauge";
import { computeDartsIq, iqToGaugePercent } from "@/features/profile/lib/profile-dashboard";
import type { SessionStats } from "@/features/statistics/store/statistics-store";

interface ProfileDartsIqProps {
  stats: SessionStats;
}

export function ProfileDartsIq({ stats }: ProfileDartsIqProps) {
  const iq = computeDartsIq(stats);
  const hasData = iq > 0;

  return (
    <ProfileCard className="profile-darts-iq">
      <h3 className="profile-panel-title">Darts IQ</h3>
      <div className="profile-darts-iq__body">
        <ProfileValueGauge
          value={hasData ? String(iq) : "—"}
          caption="IQ Score"
          fillPercent={iqToGaugePercent(iq)}
          tone="green"
          size={148}
        />

        <div className="profile-darts-iq__copy">
          <p className="profile-darts-iq__description">
            Composite of accuracy, pressure play and recovery.
          </p>
          <Link href="/statistics" className="profile-darts-iq__link">
            View breakdown &gt;
          </Link>
        </div>
      </div>
    </ProfileCard>
  );
}
