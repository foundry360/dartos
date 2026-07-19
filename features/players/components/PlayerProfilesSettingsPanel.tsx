"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CreatePlayerProfileForm } from "@/features/players/components/CreatePlayerProfileForm";
import type { CreatePlayerProfileFormInput } from "@/features/players/components/CreatePlayerProfileForm";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { SavedPlayerProfile } from "@/types/player-setup";

export function PlayerProfilesSettingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const {
    accountProfile,
    cloudProfiles,
    loading,
    saving,
    error,
    createProfile,
    updateProfile,
    removeProfile,
    isCloudConfigured,
  } = useSavedPlayerProfiles();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SavedPlayerProfile | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isCloudConfigured) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Player profiles</h3>
        <p className="settings-panel__subdescription">
          Connect Supabase to save player profiles to your account.
        </p>
      </GlassPanel>
    );
  }

  if (authLoading || loading) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Player profiles</h3>
        <p className="settings-panel__subdescription">Loading saved players...</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Player profiles</h3>
        <p className="settings-panel__subdescription">
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

  const handleCreate = async (input: CreatePlayerProfileFormInput) => {
    setFormError(null);

    try {
      await createProfile(input);
      setCreateOpen(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to save profile.");
    }
  };

  const handleUpdate = async (input: CreatePlayerProfileFormInput) => {
    if (!editingProfile) {
      return;
    }

    setFormError(null);

    try {
      await updateProfile(editingProfile.id, input);
      setEditingProfile(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to update profile.");
    }
  };

  const closeFormSheet = () => {
    setCreateOpen(false);
    setEditingProfile(null);
    setFormError(null);
  };

  return (
    <>
      <GlassPanel className="space-y-4">
        <div>
          <h3 className="settings-panel__subheading text-2xl font-bold">Player profiles</h3>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="player-profile-list">
          {accountProfile ? (
            <Link
              href="/profile"
              className="player-profile-list__row player-profile-list__row--account"
            >
              <PlayerAvatar
                name={accountProfile.name}
                color={accountProfile.color ?? "#6f9e24"}
                avatarUrl={accountProfile.avatarUrl}
                size="sm"
                className="player-profile-list__avatar"
              />
              <div className="player-profile-list__copy">
                <p className="player-profile-list__name">{accountProfile.name}</p>
                <p className="player-profile-list__nickname">Your profile</p>
              </div>
              <span className="player-profile-list__chevron" aria-hidden>
                ›
              </span>
            </Link>
          ) : null}

          {cloudProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {accountProfile ? "No saved opponents yet." : "No saved players yet."}
            </p>
          ) : (
            cloudProfiles.map((profile) => (
              <div key={profile.id} className="player-profile-list__row">
                <button
                  type="button"
                  className="player-profile-list__row-button"
                  disabled={saving}
                  onClick={() => {
                    setFormError(null);
                    setEditingProfile(profile);
                  }}
                >
                  <PlayerAvatar
                    name={profile.name}
                    color={profile.color ?? "#6f9e24"}
                    avatarUrl={profile.avatarUrl}
                    size="sm"
                    className="player-profile-list__avatar"
                  />
                  <div className="player-profile-list__copy">
                    <p className="player-profile-list__name">{profile.name}</p>
                    {profile.nickname ? (
                      <p className="player-profile-list__nickname">{profile.nickname}</p>
                    ) : null}
                  </div>
                  <span className="player-profile-list__chevron" aria-hidden>
                    ›
                  </span>
                </button>
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
            ))
          )}
        </div>

        <TouchButton fullWidth size="lg" onClick={() => setCreateOpen(true)}>
          Add player profile
        </TouchButton>
      </GlassPanel>

      <BottomSheet
        open={createOpen}
        title="New player profile"
        onClose={closeFormSheet}
      >
        <div className="sheet-form">
          <CreatePlayerProfileForm
            submitting={saving}
            error={formError}
            onCancel={closeFormSheet}
            onSubmit={handleCreate}
          />
        </div>
      </BottomSheet>

      <BottomSheet
        open={editingProfile !== null}
        title="Edit player profile"
        onClose={closeFormSheet}
      >
        <div className="sheet-form">
          {editingProfile ? (
            <CreatePlayerProfileForm
              key={editingProfile.id}
              initialValues={{
                name: editingProfile.name,
                nickname: editingProfile.nickname,
                color: editingProfile.color,
                avatarUrl: editingProfile.avatarUrl,
              }}
              submitting={saving}
              error={formError}
              submitLabel="Save changes"
              onCancel={closeFormSheet}
              onSubmit={handleUpdate}
            />
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}
