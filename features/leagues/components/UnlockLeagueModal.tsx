"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { verifyCurrentUserPassword } from "@/features/leagues/lib/league-detail-lock";

interface UnlockLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
}

export function UnlockLeagueModal({
  open,
  onOpenChange,
  onUnlocked,
}: UnlockLeagueModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const close = () => {
    if (submitting) {
      return;
    }

    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await verifyCurrentUserPassword(password);
      onUnlocked();
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to verify password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Unlock league"
      onClose={close}
      className="create-league-modal"
    >
      <form className="sheet-form create-league-modal__body" onSubmit={handleSubmit}>
        <p className="settings-panel__subdescription">
          Enter your account password to unlock editing for this league.
        </p>

        <label className="create-organization-form__field">
          <span className="create-organization-form__label">Password</span>
          <div className="league-unlock-password">
            <input
              className="setup-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={submitting}
              placeholder="Your account password"
            />
            <button
              type="button"
              className="league-unlock-password__toggle"
              onClick={() => setShowPassword((current) => !current)}
              disabled={submitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="create-league-form__actions">
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
            disabled={submitting || !password.trim()}
          >
            {submitting ? "Verifying…" : "Unlock"}
          </TouchButton>
        </div>
      </form>
    </BottomSheet>
  );
}
