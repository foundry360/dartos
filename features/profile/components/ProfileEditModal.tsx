"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FormTextField } from "@/components/ui/FormField";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { TouchButton } from "@/components/ui/TouchButton";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import {
  DEFAULT_MATCH_OPTIONS,
  FAVORITE_DOUBLE_OPTIONS,
  FAVORITE_PRACTICE_OPTIONS,
  PREFERRED_GAME_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  THROWING_HAND_OPTIONS,
} from "@/features/profile/lib/profile-options";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { createClient } from "@/lib/supabase/client";
import { updateProfileDetails } from "@/lib/supabase/queries/profile";
import type {
  DefaultMatch,
  FavoritePractice,
  PreferredGame,
  SkillLevel,
  ThrowingHand,
} from "@/types/profile";

interface ProfileEditModalProps {
  open: boolean;
  user: User | null;
  displayName: string;
  onClose: () => void;
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ProfileEditModal({ open, user, displayName, onClose }: ProfileEditModalProps) {
  const nickname = useProfileStore((state) => state.nickname);
  const throwingHand = useProfileStore((state) => state.throwingHand);
  const skillLevel = useProfileStore((state) => state.skillLevel);
  const preferredGame = useProfileStore((state) => state.preferredGame);
  const homeLeague = useProfileStore((state) => state.homeLeague);
  const favoriteDouble = useProfileStore((state) => state.favoriteDouble);
  const favoritePractice = useProfileStore((state) => state.favoritePractice);
  const defaultMatch = useProfileStore((state) => state.defaultMatch);
  const setDisplayName = useProfileStore((state) => state.setDisplayName);
  const setNickname = useProfileStore((state) => state.setNickname);
  const applyPreferences = useProfileStore((state) => state.applyPreferences);

  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [draftNickname, setDraftNickname] = useState(nickname ?? "");
  const [draftThrowingHand, setDraftThrowingHand] = useState<ThrowingHand | "">(throwingHand ?? "");
  const [draftSkillLevel, setDraftSkillLevel] = useState<SkillLevel | "">(skillLevel ?? "");
  const [draftPreferredGame, setDraftPreferredGame] = useState<PreferredGame | "">(
    preferredGame ?? "",
  );
  const [draftHomeLeague, setDraftHomeLeague] = useState(homeLeague ?? "");
  const [draftFavoriteDouble, setDraftFavoriteDouble] = useState(favoriteDouble ?? "");
  const [draftFavoritePractice, setDraftFavoritePractice] = useState<FavoritePractice | "">(
    favoritePractice ?? "",
  );
  const [draftDefaultMatch, setDraftDefaultMatch] = useState<DefaultMatch | "">(
    defaultMatch ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const favoriteDoubleOptions = useMemo(
    () => FAVORITE_DOUBLE_OPTIONS.map((option) => ({ value: option, label: option })),
    [],
  );

  useEffect(() => {
    if (open) {
      setDraftDisplayName(displayName);
      setDraftNickname(nickname ?? "");
      setDraftThrowingHand(throwingHand ?? "");
      setDraftSkillLevel(skillLevel ?? "");
      setDraftPreferredGame(preferredGame ?? "");
      setDraftHomeLeague(homeLeague ?? "");
      setDraftFavoriteDouble(favoriteDouble ?? "");
      setDraftFavoritePractice(favoritePractice ?? "");
      setDraftDefaultMatch(defaultMatch ?? "");
      setError(null);
    }
  }, [
    defaultMatch,
    displayName,
    favoriteDouble,
    favoritePractice,
    homeLeague,
    nickname,
    open,
    preferredGame,
    skillLevel,
    throwingHand,
  ]);

  const handleSave = async () => {
    const nextDisplayName = normalizeText(draftDisplayName);
    const nextNickname = normalizeText(draftNickname);
    const nextThrowingHand = draftThrowingHand || null;
    const nextSkillLevel = draftSkillLevel || null;
    const nextPreferredGame = draftPreferredGame || null;
    const nextHomeLeague = normalizeText(draftHomeLeague);
    const nextFavoriteDouble = normalizeText(draftFavoriteDouble);
    const nextFavoritePractice = draftFavoritePractice || null;
    const nextDefaultMatch = draftDefaultMatch || null;

    setSaving(true);
    setError(null);

    try {
      if (user) {
        const supabase = createClient();
        if (supabase) {
          await updateProfileDetails(supabase, user.id, {
            displayName: nextDisplayName,
            nickname: nextNickname,
            throwingHand: nextThrowingHand,
            skillLevel: nextSkillLevel,
            preferredGame: nextPreferredGame,
            homeLeague: nextHomeLeague,
            favoriteDouble: nextFavoriteDouble,
            favoritePractice: nextFavoritePractice,
            defaultMatch: nextDefaultMatch,
          });
        }
      }

      setDisplayName(nextDisplayName);
      setNickname(nextNickname);
      applyPreferences({
        throwingHand: nextThrowingHand,
        skillLevel: nextSkillLevel,
        preferredGame: nextPreferredGame,
        homeLeague: nextHomeLeague,
        favoriteDouble: nextFavoriteDouble,
        favoritePractice: nextFavoritePractice,
        defaultMatch: nextDefaultMatch,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save profile.");
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
        <div className="profile-edit-modal__intro">
          <ProfileAvatar
            user={user}
            displayName={draftDisplayName}
            interactive
            className="profile-edit-modal__avatar"
          />
        </div>

        <div className="profile-edit-modal__fields">
          <FormTextField
            label="Display name"
            value={draftDisplayName}
            onChange={(event) => setDraftDisplayName(event.target.value)}
            placeholder="Your name"
            maxLength={48}
            autoComplete="name"
            disabled={saving}
          />

          <FormTextField
            label="Nickname"
            value={draftNickname}
            onChange={(event) => setDraftNickname(event.target.value)}
            placeholder="Add a nickname"
            maxLength={32}
            autoComplete="nickname"
            disabled={saving}
          />

          <OptionPickerField
            label="Throwing hand"
            value={draftThrowingHand}
            options={THROWING_HAND_OPTIONS}
            onChange={setDraftThrowingHand}
            placeholder="Select hand"
            disabled={saving}
          />

          <OptionPickerField
            label="Skill level"
            value={draftSkillLevel}
            options={SKILL_LEVEL_OPTIONS}
            onChange={setDraftSkillLevel}
            placeholder="Select level"
            disabled={saving}
          />

          <OptionPickerField
            label="Preferred game"
            value={draftPreferredGame}
            options={PREFERRED_GAME_OPTIONS}
            onChange={setDraftPreferredGame}
            placeholder="Select game"
            disabled={saving}
          />

          <FormTextField
            label="Home league / team"
            value={draftHomeLeague}
            onChange={(event) => setDraftHomeLeague(event.target.value)}
            placeholder="Optional"
            maxLength={64}
            disabled={saving}
          />

          <OptionPickerField
            label="Favorite double"
            value={draftFavoriteDouble}
            options={favoriteDoubleOptions}
            onChange={setDraftFavoriteDouble}
            placeholder="Select double"
            disabled={saving}
          />

          <OptionPickerField
            label="Favorite practice"
            value={draftFavoritePractice}
            options={FAVORITE_PRACTICE_OPTIONS}
            onChange={setDraftFavoritePractice}
            placeholder="Select practice"
            disabled={saving}
          />

          <OptionPickerField
            label="Default match"
            value={draftDefaultMatch}
            options={DEFAULT_MATCH_OPTIONS}
            onChange={setDraftDefaultMatch}
            placeholder="Select match"
            disabled={saving}
          />
        </div>

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
