"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { PaymentMethodBrandIcon } from "@/features/wallet/components/PaymentMethodBrandIcon";
import {
  formatPaymentMethodExpiry,
  formatPaymentMethodLabel,
  isPaymentMethodInactive,
} from "@/features/wallet/lib/format-wallet";
import { getWalletApiErrorMessage, postWalletApi } from "@/features/wallet/lib/wallet-api-error";
import type { WalletPaymentMethod } from "@/types/wallet";
import { cn } from "@/utils/cn";

interface DeletePaymentMethodsModalProps {
  open: boolean;
  paymentMethods: WalletPaymentMethod[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function DeletePaymentMethodsModal({
  open,
  paymentMethods,
  onClose,
  onSuccess,
}: DeletePaymentMethodsModalProps) {
  const inactivePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => isPaymentMethodInactive(method)),
    [paymentMethods],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const toggleSelection = (paymentMethodId: string) => {
    setSelectedIds((current) =>
      current.includes(paymentMethodId)
        ? current.filter((id) => id !== paymentMethodId)
        : [...current, paymentMethodId],
    );
    setError(null);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      setError("Select at least one inactive card to delete.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await postWalletApi<{ success?: boolean }>("/api/stripe/payment-method/delete", {
        paymentMethodIds: selectedIds,
      });

      await onSuccess();
      onClose();
    } catch (caught) {
      setError(getWalletApiErrorMessage(caught, "Unable to delete payment methods."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Delete payment methods"
      onClose={onClose}
      className="profile-edit-modal wallet-payment-modal"
    >
      <div className="profile-edit-modal__body">
        <p className="profile-edit-modal__intro">
          Select inactive cards to remove from billing.
        </p>

        {inactivePaymentMethods.length === 0 ? (
          <p className="wallet-settings__empty">No inactive cards to delete.</p>
        ) : (
          <ul className="wallet-payment-delete__list">
            {inactivePaymentMethods.map((method) => {
              const expiry = formatPaymentMethodExpiry(method);
              const checked = selectedIds.includes(method.stripePaymentMethodId);

              return (
                <li key={method.id}>
                  <label
                    className={cn(
                      "wallet-payment-delete__option",
                      checked && "wallet-payment-delete__option--selected",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="wallet-payment-delete__checkbox"
                      checked={checked}
                      disabled={submitting}
                      onChange={() => toggleSelection(method.stripePaymentMethodId)}
                    />
                    <span className="wallet-payment-delete__option-main">
                      <span className="wallet-settings__item-title wallet-settings__item-title--payment">
                        {method.type === "card" ? (
                          <PaymentMethodBrandIcon brand={method.brand} />
                        ) : null}
                        <span>{formatPaymentMethodLabel(method)}</span>
                      </span>
                      {expiry ? (
                        <span className="wallet-settings__item-meta wallet-settings__item-meta--expiry">
                          {expiry}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {error ? <p className="profile-edit-modal__error">{error}</p> : null}

        <div className="profile-edit-modal__actions">
          <TouchButton variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
            Cancel
          </TouchButton>
          <TouchButton
            size="lg"
            disabled={submitting || inactivePaymentMethods.length === 0 || selectedIds.length === 0}
            onClick={() => void handleDelete()}
          >
            {submitting ? "Deleting…" : "Delete selected"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
