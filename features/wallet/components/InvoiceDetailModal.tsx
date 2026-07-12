"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  formatInvoiceBillingPeriod,
  formatInvoiceDate,
  formatInvoiceNumber,
  formatInvoiceStatus,
  formatWalletAmount,
  getInvoiceDisplayAmountCents,
} from "@/features/wallet/lib/format-wallet";
import type { WalletInvoice } from "@/types/wallet";
import { cn } from "@/utils/cn";

interface InvoiceDetailModalProps {
  open: boolean;
  invoice: WalletInvoice | null;
  onClose: () => void;
}

export function InvoiceDetailModal({ open, invoice, onClose }: InvoiceDetailModalProps) {
  if (!invoice) {
    return null;
  }

  const billingPeriod = formatInvoiceBillingPeriod(invoice);
  const amount = getInvoiceDisplayAmountCents(invoice);

  return (
    <BottomSheet
      open={open}
      title="Invoice"
      onClose={onClose}
      className="profile-edit-modal wallet-invoice-modal"
    >
      <div className="profile-edit-modal__body">
        <div className="wallet-invoice-modal__header">
          <div>
            <p className="wallet-invoice-modal__number">{formatInvoiceNumber(invoice)}</p>
            <p className="wallet-invoice-modal__date">{formatInvoiceDate(invoice)}</p>
          </div>
          <span
            className={cn(
              "wallet-invoice-modal__status",
              invoice.status === "paid" && "wallet-invoice-modal__status--paid",
            )}
          >
            {formatInvoiceStatus(invoice.status)}
          </span>
        </div>

        <div className="onboarding-payment-summary wallet-invoice-modal__summary">
          {invoice.description ? (
            <div className="onboarding-payment-summary__row">
              <span className="onboarding-payment-summary__key">Description</span>
              <span className="onboarding-payment-summary__value">{invoice.description}</span>
            </div>
          ) : null}

          {billingPeriod ? (
            <div className="onboarding-payment-summary__row">
              <span className="onboarding-payment-summary__key">Service period</span>
              <span className="onboarding-payment-summary__value">{billingPeriod}</span>
            </div>
          ) : null}

          <div className="onboarding-payment-summary__row onboarding-payment-summary__row--total">
            <span className="onboarding-payment-summary__key">Amount</span>
            <span className="onboarding-payment-summary__value">
              {formatWalletAmount(amount, invoice.currency)}
            </span>
          </div>
        </div>

        <div className="profile-edit-modal__actions">
          <TouchButton fullWidth onClick={onClose}>
            Close
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
