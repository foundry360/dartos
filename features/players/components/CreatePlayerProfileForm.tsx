"use client";

import { useState } from "react";
import { TouchButton } from "@/components/ui/TouchButton";
import { SavedPlayerAvatarPicker } from "@/features/players/components/SavedPlayerAvatarPicker";
import { cn } from "@/utils/cn";

const PROFILE_COLORS = [
  "#84c126",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
] as const;

export interface CreatePlayerProfileFormInput {
  name: string;
  nickname?: string;
  color: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

export interface PlayerProfileFormInitialValues {
  name: string;
  nickname?: string | null;
  color: string | null;
  avatarUrl?: string | null;
}

interface CreatePlayerProfileFormProps {
  initialValues?: PlayerProfileFormInitialValues;
  onSubmit: (input: CreatePlayerProfileFormInput) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function CreatePlayerProfileForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
  submitLabel = "Save profile",
}: CreatePlayerProfileFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [nickname, setNickname] = useState(initialValues?.nickname ?? "");
  const [color, setColor] = useState<string | null>(
    initialValues?.color ?? PROFILE_COLORS[0]!,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      name,
      nickname: nickname.trim() || undefined,
      color,
      avatarFile,
      removeAvatar,
    });
  };

  return (
    <form className="create-player-form" onSubmit={(event) => void handleSubmit(event)}>
      <SavedPlayerAvatarPicker
        color={color}
        value={avatarFile}
        existingAvatarUrl={initialValues?.avatarUrl}
        existingAvatarRemoved={removeAvatar}
        onChange={(file) => {
          setAvatarFile(file);
          if (file) {
            setRemoveAvatar(false);
          }
        }}
        onRemoveExisting={() => setRemoveAvatar(true)}
        disabled={submitting}
      />

      <label className="create-player-form__field">
        <span className="create-player-form__label">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="setup-input"
          placeholder="Player name"
          autoFocus={!initialValues}
          required
        />
      </label>

      <label className="create-player-form__field">
        <span className="create-player-form__label">Nickname (optional)</span>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className="setup-input"
          placeholder="Nickname"
        />
      </label>

      <div className="create-player-form__field">
        <span className="create-player-form__label">Color</span>
        <div className="create-player-form__colors" role="radiogroup" aria-label="Player color">
          {PROFILE_COLORS.map((option) => {
            const selected = color === option;

            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Color ${option}`}
                className={cn(
                  "create-player-form__color",
                  selected && "create-player-form__color--selected",
                )}
                style={{ backgroundColor: option }}
                onClick={() => setColor(option)}
              />
            );
          })}
        </div>
      </div>

      {error ? <p className="create-player-form__error">{error}</p> : null}

      <div className="create-player-form__actions">
        <TouchButton type="submit" fullWidth size="lg" disabled={submitting || !name.trim()}>
          {submitting ? "Saving..." : submitLabel}
        </TouchButton>
        {onCancel ? (
          <TouchButton type="button" variant="secondary" fullWidth size="lg" onClick={onCancel}>
            Cancel
          </TouchButton>
        ) : null}
      </div>
    </form>
  );
}
