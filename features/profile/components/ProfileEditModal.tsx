"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { createClient } from "@/lib/supabase/client";
import { updateProfileNickname } from "@/lib/supabase/queries/profile";
import { useProfileStore } from "@/features/profile/store/profile-store";

interface ProfileEditModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

function normalizeNickname(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProfileEditModal({ open, user, onClose }: ProfileEditModalProps) {
  const nickname = useProfileStore((state) => state.nickname);
  const setNickname = useProfileStore((state) => state.setNickname);
  const [draft, setDraft] = useState(nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(nickname ?? "");
      setError(null);
    }
  }, [nickname, open]);

  const handleSave = async () => {
    const nextNickname = normalizeNickname(draft);

    if (nextNickname === nickname) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (user) {
        const supabase = createClient();
        if (supabase) {
          try {
            await updateProfileNickname(supabase, user.id, nextNickname);
          } catch (caught) {
            console.error("Failed to sync nickname to Supabase", caught);
          }
        }
      }

      setNickname(nextNickname);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save nickname.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Edit profile"
      onClose={onClose}
      className="profile-edit-modal"
    >
      <div className="profile-edit-modal__body">
        <ProfileAvatar user={user} displayName="" interactive />

        <label className="profile-edit-modal__field">
          <span className="profile-edit-modal__label">Nickname</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="setup-input"
            placeholder="Add a nickname"
            maxLength={32}
            autoComplete="nickname"
            enterKeyHint="done"
            disabled={saving}
          />
          <span className="profile-edit-modal__hint">
            Shown on scoreboards and in player lists
          </span>
        </label>

        {!user ? (
          <p className="profile-edit-modal__hint profile-edit-modal__hint--centered">
            Sign in to sync your profile to the cloud.
          </p>
        ) : null}

        {error ? <p className="profile-edit-modal__error">{error}</p> : null}

        <div className="profile-edit-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="button"
            fullWidth
            size="lg"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving..." : "Save"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
