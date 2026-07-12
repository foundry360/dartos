"use client";

import { useEffect, useId, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";
import { ACCOUNT_REACTIVATION_NOTE } from "@/lib/account/deactivated-account-message";

const REMOVE_CONFIRMATION_TEXT = "Remove";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}

export function DeleteAccountModal({
  open,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const fieldId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canRemove = confirmation === REMOVE_CONFIRMATION_TEXT;

  useEffect(() => {
    if (!open) {
      setConfirmation("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!canRemove || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to remove account.");
      }

      await onDeleted();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Remove account"
      onClose={onClose}
      className="profile-edit-modal account-delete-modal"
    >
      <div className="profile-edit-modal__body">
        <p className="profile-edit-modal__intro">
          Your account will be deactivated and you&apos;ll be signed out. Active subscriptions will
          be canceled.
        </p>
        <p className="account-delete-modal__note">{ACCOUNT_REACTIVATION_NOTE}</p>

        <div className="auth-screen__field">
          <label className="auth-screen__label" htmlFor={fieldId}>
            Type <strong>{REMOVE_CONFIRMATION_TEXT}</strong> to confirm
          </label>
          <div className={cn("auth-screen__field-shell", "account-delete-modal__input-shell")}>
            <input
              id={fieldId}
              className="auth-screen__input auth-screen__input--flush"
              type="text"
              value={confirmation}
              autoComplete="off"
              disabled={submitting}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError(null);
              }}
            />
          </div>
        </div>

        {error ? <p className="profile-edit-modal__error">{error}</p> : null}

        <div className="profile-edit-modal__actions account-delete-modal__actions">
          <TouchButton variant="secondary" disabled={submitting} onClick={onClose}>
            Cancel
          </TouchButton>
          <TouchButton
            variant="primary"
            accentColor="#ef4444"
            className="account-delete-modal__remove-btn"
            disabled={!canRemove || submitting}
            onClick={() => void handleDelete()}
          >
            {submitting ? "Removing..." : "Remove account"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
