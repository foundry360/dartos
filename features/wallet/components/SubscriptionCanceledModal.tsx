"use client";

import { useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface SubscriptionCanceledModalProps {
  open: boolean;
  accessUntilLabel: string | null;
  onComplete: () => void | Promise<void>;
}

export function SubscriptionCanceledModal({
  open,
  accessUntilLabel,
  onComplete,
}: SubscriptionCanceledModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      void Promise.resolve(onComplete());
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, onComplete]);

  return (
    <BottomSheet
      open={open}
      title="Subscription canceled"
      onClose={() => {}}
      className="profile-edit-modal subscription-canceled-modal"
    >
      <div className="profile-edit-modal__body">
        <p className="subscription-canceled-modal__message">
          Your subscription has been canceled.
          {accessUntilLabel
            ? ` You can keep using DartOS until ${accessUntilLabel}.`
            : null}
        </p>
        <p className="subscription-canceled-modal__redirect">
          Signing you out in a few seconds…
        </p>
      </div>
    </BottomSheet>
  );
}
