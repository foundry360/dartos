"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { ProfileAverageTrend } from "@/features/profile/components/ProfileAverageTrend";
import { ProfileDartsIq } from "@/features/profile/components/ProfileDartsIq";
import { ProfileEditModal } from "@/features/profile/components/ProfileEditModal";
import { ProfileHeroStats } from "@/features/profile/components/ProfileHeroStats";
import { ProfileSidebar } from "@/features/profile/components/ProfileSidebar";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";
import "@/features/profile/profile-page.css";

interface ProfileScreenProps {
  user: User | null;
  displayName: string;
}

export function ProfileScreen({ user, displayName }: ProfileScreenProps) {
  const cloudDisplayName = useProfileStore((state) => state.displayName);
  const stats = useStatisticsStore((state) => state.stats);
  const matches = useMatchHistoryStore((state) => state.matches);
  const resolvedName = cloudDisplayName ?? displayName;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <MobileAppShell title="Profile" className="profile-page shell-page">
      <div className="profile-page__dashboard">
        <ProfileSidebar
          user={user}
          displayName={resolvedName}
          stats={stats}
          matches={matches}
          onEdit={() => setEditOpen(true)}
        />

        <div className="profile-page__main">
          <ProfileHeroStats stats={stats} />
          <div className="profile-page__insights">
            <ProfileAverageTrend stats={stats} />
            <ProfileDartsIq stats={stats} />
          </div>
        </div>
      </div>

      <ProfileEditModal
        open={editOpen}
        user={user}
        displayName={resolvedName}
        onClose={() => setEditOpen(false)}
      />
    </MobileAppShell>
  );
}
