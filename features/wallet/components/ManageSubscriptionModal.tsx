"use client";

import { useCallback, useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TouchButton } from "@/components/ui/TouchButton";
import { SubscriptionCanceledModal } from "@/features/wallet/components/SubscriptionCanceledModal";
import {
  formatSubscriptionPrice,
  formatSubscriptionRenewal,
  formatSubscriptionStatus,
} from "@/features/wallet/lib/format-wallet";
import { getWalletApiErrorMessage, postWalletApi } from "@/features/wallet/lib/wallet-api-error";
import type { WalletSubscription } from "@/types/wallet";

interface ManageSubscriptionModalProps {
  open: boolean;
  subscription: WalletSubscription | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  onCanceled: () => void | Promise<void>;
}

function getAccessUntilLabel(subscription: WalletSubscription): string | null {
  const renewal = formatSubscriptionRenewal(subscription);
  if (!renewal) {
    return null;
  }

  return renewal.replace(/^(Renews|Trial ends|Ends) /, "");
}

function getCancelDescription(subscription: WalletSubscription): string {
  const renewal = formatSubscriptionRenewal(subscription);

  if (subscription.status === "trialing") {
    return renewal
      ? `Your trial will continue until ${renewal.replace(/^Trial ends /, "")}, but you will not be charged afterward.`
      : "Your trial will continue until it ends, but you will not be charged afterward.";
  }

  return renewal
    ? `You will keep access until ${renewal.replace(/^(Renews|Ends) /, "")}.`
    : "You will keep access until the end of your current billing period.";
}

export function ManageSubscriptionModal({
  open,
  subscription,
  onClose,
  onSuccess,
  onCanceled,
}: ManageSubscriptionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [canceledOpen, setCanceledOpen] = useState(false);
  const [accessUntilLabel, setAccessUntilLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setConfirmCancelOpen(false);
    }
  }, [open]);

  const handleCanceledComplete = useCallback(async () => {
    setCanceledOpen(false);
    await onCanceled();
  }, [onCanceled]);

  const handleResume = async () => {
    if (!subscription) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postWalletApi<{ success?: boolean }>("/api/stripe/subscription/resume");
      await onSuccess();
      onClose();
    } catch (caught) {
      setError(getWalletApiErrorMessage(caught, "Unable to keep subscription active."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postWalletApi<{ success?: boolean }>("/api/stripe/subscription/cancel");
      setAccessUntilLabel(getAccessUntilLabel(subscription));
      setConfirmCancelOpen(false);
      onClose();
      setCanceledOpen(true);
      await onSuccess();
    } catch (caught) {
      setError(getWalletApiErrorMessage(caught, "Unable to cancel subscription."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {subscription ? (
        <>
          <BottomSheet
            open={open}
            title="Manage subscription"
            onClose={onClose}
            className="profile-edit-modal wallet-subscription-modal"
          >
            <div className="profile-edit-modal__body">
              <div className="wallet-subscription-modal__summary">
                <p className="wallet-subscription-modal__plan">{subscription.planName}</p>
                <p className="wallet-subscription-modal__meta">
                  {[
                    formatSubscriptionStatus(subscription.status),
                    formatSubscriptionPrice(subscription),
                    formatSubscriptionRenewal(subscription),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {subscription.cancelAtPeriodEnd ? (
                <p className="profile-edit-modal__intro">
                  Your subscription is set to end at the close of the current period. You can keep it
                  active to continue billing automatically.
                </p>
              ) : subscription.status === "past_due" ? (
                <p className="profile-edit-modal__intro">
                  Your last payment did not go through. Update your default payment method below, then
                  Stripe will retry the charge.
                </p>
              ) : (
                <p className="profile-edit-modal__intro">
                  Cancel anytime. {getCancelDescription(subscription)}
                </p>
              )}

              {error ? <p className="profile-edit-modal__error">{error}</p> : null}

              <div className="profile-edit-modal__actions">
                <TouchButton variant="secondary" disabled={submitting} onClick={onClose}>
                  Close
                </TouchButton>

                {subscription.cancelAtPeriodEnd ? (
                  <TouchButton disabled={submitting} onClick={() => void handleResume()}>
                    {submitting ? "Saving…" : "Keep subscription"}
                  </TouchButton>
                ) : (
                  <TouchButton
                    variant="primary"
                    accentColor="#ef4444"
                    disabled={submitting}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    Cancel subscription
                  </TouchButton>
                )}
              </div>
            </div>
          </BottomSheet>

          <ConfirmDialog
            open={confirmCancelOpen}
            title="Cancel subscription?"
            description={getCancelDescription(subscription)}
            confirmLabel={submitting ? "Canceling…" : "Cancel subscription"}
            cancelLabel="Keep subscription"
            confirmVariant="danger"
            onConfirm={() => void handleCancel()}
            onCancel={() => setConfirmCancelOpen(false)}
          />
        </>
      ) : null}

      <SubscriptionCanceledModal
        open={canceledOpen}
        accessUntilLabel={accessUntilLabel}
        onComplete={handleCanceledComplete}
      />
    </>
  );
}
