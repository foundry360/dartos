"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileEditModal } from "@/features/profile/components/ProfileEditModal";
import { ProfileStatsSection } from "@/features/profile/components/ProfileStatsSection";
import { buildProfileStatSections } from "@/features/profile/lib/profile-stats";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";

interface ProfileScreenProps {
  user: User | null;
  displayName: string;
}

export function ProfileScreen({ user, displayName }: ProfileScreenProps) {
  const cloudDisplayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const stats = useStatisticsStore((state) => state.stats);
  const sections = buildProfileStatSections(stats);
  const resolvedName = cloudDisplayName ?? displayName;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <MobileAppShell title="Profile" className="profile-page shell-page">
      <PlayScreenHero eyebrow="DartScorer" title="Profile" subtitle="Your stats" />

      <section className="profile-page__header">
        <ProfileAvatar
          user={user}
          displayName={resolvedName}
          interactive={false}
          onEdit={() => setEditOpen(true)}
        />
        <h2 className="profile-page__name">{resolvedName}</h2>
        {nickname ? <p className="profile-page__nickname">&ldquo;{nickname}&rdquo;</p> : null}
        {user?.email ? <p className="profile-page__email">{user.email}</p> : null}
      </section>

      <section className="profile-page__stats">
        {sections.map((section) => (
          <ProfileStatsSection key={section.title} section={section} />
        ))}
      </section>

      <ProfileEditModal open={editOpen} user={user} onClose={() => setEditOpen(false)} />
    </MobileAppShell>
  );
}
