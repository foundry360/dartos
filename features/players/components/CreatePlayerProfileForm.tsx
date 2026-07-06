"use client";

import { useState } from "react";
import { TouchButton } from "@/components/ui/TouchButton";
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

interface CreatePlayerProfileFormProps {
  onSubmit: (input: { name: string; nickname?: string; color: string | null }) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function CreatePlayerProfileForm({
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
  submitLabel = "Save profile",
}: CreatePlayerProfileFormProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState<string | null>(PROFILE_COLORS[0]!);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      name,
      nickname: nickname.trim() || undefined,
      color,
    });
  };

  return (
    <form className="create-player-form" onSubmit={(event) => void handleSubmit(event)}>
      <label className="create-player-form__field">
        <span className="create-player-form__label">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="setup-input"
          placeholder="Player name"
          autoFocus
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
