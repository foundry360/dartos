"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CreatePlayerProfileForm } from "@/features/players/components/CreatePlayerProfileForm";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { useSavedPlayerStatsStore } from "@/features/players/store/saved-player-stats-store";
import {
  getLegWinPercentage,
  getWinPercentage,
  type SessionStats,
} from "@/features/statistics/store/statistics-store";
import { LOGIN_PATH } from "@/lib/auth/routes";

function formatSavedPlayerStats(stats: SessionStats) {
  if (stats.matchesPlayed === 0 && stats.legsPlayed === 0 && stats.dartsThrown === 0) {
    return null;
  }

  const parts: string[] = [];

  if (stats.matchesPlayed > 0) {
    parts.push(`${stats.matchesWon}/${stats.matchesPlayed} matches (${getWinPercentage(stats)}%)`);
  }

  if (stats.legsPlayed > 0) {
    parts.push(`${stats.legsWon}/${stats.legsPlayed} legs (${getLegWinPercentage(stats)}%)`);
  }

  if (stats.dartsThrown > 0) {
    parts.push(`${stats.dartsThrown} darts`);
  }

  return parts.join(" · ");
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function PlayerProfilesSettingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const {
    cloudProfiles,
    loading,
    saving,
    error,
    createProfile,
    removeProfile,
    isCloudConfigured,
  } = useSavedPlayerProfiles();
  const statsByProfileId = useSavedPlayerStatsStore((state) => state.byProfileId);
  const [createOpen, setCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isCloudConfigured) {
    return (
      <GlassPanel>
        <h3 className="text-lg">Player profiles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect Supabase to save player profiles to your account.
        </p>
      </GlassPanel>
    );
  }

  if (authLoading || loading) {
    return (
      <GlassPanel>
        <h3 className="text-lg">Player profiles</h3>
        <p className="mt-2 text-sm text-muted-foreground">Loading saved players...</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h3 className="text-lg">Player profiles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to create and sync saved player profiles across devices.
        </p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </GlassPanel>
    );
  }

  const handleCreate = async (input: { name: string; nickname?: string; color: string | null }) => {
    setFormError(null);

    try {
      await createProfile(input);
      setCreateOpen(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save profile.");
    }
  };

  return (
    <>
      <GlassPanel className="space-y-4">
        <div>
          <h3 className="text-lg">Player profiles</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved players appear when adding players to a match.
          </p>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {cloudProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved players yet.</p>
        ) : (
          <div className="player-profile-list">
            {cloudProfiles.map((profile) => {
              const stats = statsByProfileId[profile.id];
              const statsSummary = stats ? formatSavedPlayerStats(stats) : null;

              return (
              <div key={profile.id} className="player-profile-list__row">
                <span
                  className="player-profile-list__avatar"
                  style={{
                    backgroundColor: profile.color ?? "#84c126",
                  }}
                >
                  {getInitial(profile.name)}
                </span>
                <div className="player-profile-list__copy">
                  <p className="player-profile-list__name">{profile.name}</p>
                  {profile.nickname ? (
                    <p className="player-profile-list__nickname">{profile.nickname}</p>
                  ) : null}
                  {statsSummary ? (
                    <p className="player-profile-list__stats">{statsSummary}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="player-profile-list__remove"
                  aria-label={`Delete ${profile.name}`}
                  disabled={saving}
                  onClick={() => void removeProfile(profile.id)}
                >
                  ×
                </button>
              </div>
            );
            })}
          </div>
        )}

        <TouchButton fullWidth size="lg" onClick={() => setCreateOpen(true)}>
          Add player profile
        </TouchButton>
      </GlassPanel>

      <BottomSheet
        open={createOpen}
        title="New player profile"
        onClose={() => {
          setCreateOpen(false);
          setFormError(null);
        }}
      >
        <div className="sheet-form">
          <CreatePlayerProfileForm
            submitting={saving}
            error={formError}
            onCancel={() => {
              setCreateOpen(false);
              setFormError(null);
            }}
            onSubmit={handleCreate}
          />
        </div>
      </BottomSheet>
    </>
  );
}
