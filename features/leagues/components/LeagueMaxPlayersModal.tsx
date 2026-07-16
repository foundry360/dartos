"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";

interface LeagueMaxPlayersModalProps {
  open: boolean;
  currentCount: number;
  maxPlayers: number;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (nextMaxPlayers: number) => Promise<void>;
}

export function LeagueMaxPlayersModal({
  open,
  currentCount,
  maxPlayers,
  submitting = false,
  onOpenChange,
  onSave,
}: LeagueMaxPlayersModalProps) {
  const minimum = Math.max(currentCount + 1, maxPlayers + 1);
  const [value, setValue] = useState(String(minimum));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    setValue(String(Math.max(currentCount + 1, maxPlayers + 1)));
    setError(null);
  }, [open, currentCount, maxPlayers]);

  const close = () => {
    if (submitting) {
      return;
    }

    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = Number.parseInt(value.trim(), 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid maximum greater than zero.");
      return;
    }

    if (parsed <= currentCount) {
      setError(
        `Maximum must be at least ${currentCount + 1} so you can add another player.`,
      );
      return;
    }

    if (parsed <= maxPlayers) {
      setError(`Maximum must be greater than the current limit of ${maxPlayers}.`);
      return;
    }

    try {
      await onSave(parsed);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the player limit.",
      );
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Roster full"
      onClose={close}
      className="league-unlock-modal"
    >
      <form className="sheet-form league-unlock-modal__body" onSubmit={handleSubmit}>
        <p className="settings-panel__subdescription">
          You’ve reached the maximum of {maxPlayers} player
          {maxPlayers === 1 ? "" : "s"} for this league. Increase the limit to add
          more players.
        </p>

        <label className="create-organization-form__field">
          <span className="create-organization-form__label">
            Maximum players
          </span>
          <input
            className="setup-input"
            type="number"
            inputMode="numeric"
            min={minimum}
            step={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            disabled={submitting}
            autoFocus
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="league-unlock-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={submitting}
            onClick={close}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="submit"
            fullWidth
            size="lg"
            disabled={submitting || !value.trim()}
          >
            {submitting ? "Saving…" : "Update maximum"}
          </TouchButton>
        </div>
      </form>
    </BottomSheet>
  );
}
