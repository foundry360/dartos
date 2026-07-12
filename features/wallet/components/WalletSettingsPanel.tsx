"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  formatBillingPeriodRange,
  formatInvoiceDate,
  formatInvoiceNumber,
  formatPaymentMethodExpiry,
  formatPaymentMethodLabel,
  isPaymentMethodInactive,
  formatSubscriptionInterval,
  formatSubscriptionPrice,
  formatSubscriptionRenewal,
  formatSubscriptionStatus,
  formatWalletAmount,
} from "@/features/wallet/lib/format-wallet";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { PaymentMethodBrandIcon } from "@/features/wallet/components/PaymentMethodBrandIcon";
import { DeletePaymentMethodsModal } from "@/features/wallet/components/DeletePaymentMethodsModal";
import { InvoiceDetailModal } from "@/features/wallet/components/InvoiceDetailModal";
import { UpdatePaymentMethodModal } from "@/features/wallet/components/UpdatePaymentMethodModal";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { WalletInvoice, WalletPaymentMethod } from "@/types/wallet";
import { getWalletApiErrorMessage, postWalletApi } from "@/features/wallet/lib/wallet-api-error";
import { cn } from "@/utils/cn";

export function WalletSettingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const { wallet, loading, error, reload } = useWalletData();
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [deletePaymentMethodsModalOpen, setDeletePaymentMethodsModalOpen] = useState(false);
  const [activatingPaymentMethodId, setActivatingPaymentMethodId] = useState<string | null>(null);
  const [paymentMethodError, setPaymentMethodError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<WalletInvoice | null>(null);

  const handleOpenPaymentMethodModal = () => {
    setPaymentMethodModalOpen(true);
  };

  const handleClosePaymentMethodModal = () => {
    setPaymentMethodModalOpen(false);
  };

  const handleOpenDeletePaymentMethodsModal = () => {
    setDeletePaymentMethodsModalOpen(true);
  };

  const handleCloseDeletePaymentMethodsModal = () => {
    setDeletePaymentMethodsModalOpen(false);
  };

  const inactivePaymentMethodCount = wallet.paymentMethods.filter((method) =>
    isPaymentMethodInactive(method),
  ).length;

  const handleActivatePaymentMethod = async (method: WalletPaymentMethod) => {
    if (method.isDefault && method.isActive) {
      return;
    }

    setPaymentMethodError(null);
    setActivatingPaymentMethodId(method.stripePaymentMethodId);

    try {
      await postWalletApi<{ success?: boolean }>("/api/stripe/payment-method/activate", {
        paymentMethodId: method.stripePaymentMethodId,
      });

      await reload();
    } catch (caught) {
      const message = getWalletApiErrorMessage(caught, "Unable to activate payment method.");
      setPaymentMethodError(message);
    } finally {
      setActivatingPaymentMethodId(null);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Billing</h3>
        <p className="settings-panel__subdescription">
          Connect Supabase to sync billing details across devices.
        </p>
      </GlassPanel>
    );
  }

  if (authLoading || loading) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Billing</h3>
        <p className="settings-panel__subdescription">Loading billing…</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Billing</h3>
        <p className="settings-panel__subdescription">
          Sign in to manage payment methods and view billing history.
        </p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </GlassPanel>
    );
  }

  return (
    <div className="wallet-settings">
      {error ? (
        <GlassPanel className="wallet-settings__error">
          <p className="auth-screen__error">{error}</p>
          <TouchButton className="mt-3" variant="secondary" size="md" onClick={() => void reload()}>
            Retry
          </TouchButton>
        </GlassPanel>
      ) : null}

      <GlassPanel className="wallet-settings__section">
        <h4 className="wallet-settings__section-title">Active Subscription</h4>

        {!wallet.subscription ? (
          <p className="wallet-settings__empty">
            No active subscription. Your subscription will appear here after checkout.
          </p>
        ) : (
          <div className="wallet-settings__item wallet-settings__item--subscription">
            <div className="wallet-settings__item-main">
              <p className="wallet-settings__item-title">{wallet.subscription.planName}</p>
              <p className="wallet-settings__item-meta">
                {[
                  formatSubscriptionStatus(wallet.subscription.status),
                  formatSubscriptionPrice(wallet.subscription),
                  formatSubscriptionRenewal(wallet.subscription),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {wallet.subscription.status === "active" || wallet.subscription.status === "trialing" ? (
              <TouchButton
                size="md"
                variant="secondary"
                disabled
                className="wallet-settings__item-action"
              >
                Manage
              </TouchButton>
            ) : null}
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="wallet-settings__section">
        <div className="wallet-settings__section-header">
          <h4 className="wallet-settings__section-title">Payment methods</h4>
          <div className="wallet-settings__section-actions">
            <TouchButton
              size="md"
              variant="secondary"
              className="wallet-settings__section-action"
              onClick={handleOpenPaymentMethodModal}
            >
              Add New
            </TouchButton>
            <TouchButton
              size="md"
              variant="secondary"
              className="wallet-settings__section-action"
              disabled={inactivePaymentMethodCount === 0}
              onClick={handleOpenDeletePaymentMethodsModal}
            >
              Delete
            </TouchButton>
          </div>
        </div>

        {paymentMethodError ? <p className="auth-screen__error">{paymentMethodError}</p> : null}

        {wallet.paymentMethods.length === 0 ? (
          <p className="wallet-settings__empty">
            No payment method on file. Add a card to use for your subscription.
          </p>
        ) : (
          <ul className="wallet-settings__list">
            {wallet.paymentMethods.map((method) => {
              const expiry = formatPaymentMethodExpiry(method);
              const inactive = isPaymentMethodInactive(method);
              const isActive = method.isDefault && method.isActive;
              const isActivating = activatingPaymentMethodId === method.stripePaymentMethodId;

              return (
                <li
                  key={method.id}
                  className={cn("wallet-settings__item", inactive && "wallet-settings__item--inactive")}
                >
                  <div className="wallet-settings__item-main">
                    <p className="wallet-settings__item-title wallet-settings__item-title--payment">
                      {method.type === "card" ? (
                        <PaymentMethodBrandIcon brand={method.brand} />
                      ) : null}
                      <span>{formatPaymentMethodLabel(method)}</span>
                    </p>
                    {expiry ? (
                      <p className="wallet-settings__item-meta wallet-settings__item-meta--expiry">
                        {expiry}
                      </p>
                    ) : null}
                    {inactive ? (
                      <p className="wallet-settings__item-meta wallet-settings__item-meta--status">
                        Inactive
                      </p>
                    ) : null}
                  </div>
                  <ToggleSwitch
                    enabled={isActive}
                    onChange={(enabled) => {
                      if (enabled) {
                        void handleActivatePaymentMethod(method);
                      }
                    }}
                    label={`Use ${formatPaymentMethodLabel(method)}`}
                    className="wallet-settings__item-toggle"
                    disabled={
                      !method.isActive ||
                      isActivating ||
                      activatingPaymentMethodId !== null
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel className="wallet-settings__section">
        <h4 className="wallet-settings__section-title">Billing period</h4>

        {!wallet.subscription || !formatBillingPeriodRange(wallet.subscription) ? (
          <p className="wallet-settings__empty">
            Your current billing period will appear here when you have an active subscription.
          </p>
        ) : (
          <div className="wallet-settings__item wallet-settings__item--billing-period">
            <div className="wallet-settings__item-main">
              <p className="wallet-settings__item-title">
                {formatBillingPeriodRange(wallet.subscription)}
              </p>
              <p className="wallet-settings__item-meta">
                {[
                  formatSubscriptionInterval(wallet.subscription.interval),
                  formatSubscriptionRenewal(wallet.subscription),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="wallet-settings__section">
        <h4 className="wallet-settings__section-title">Billing history</h4>

        {wallet.invoices.length === 0 ? (
          <p className="wallet-settings__empty">
            No billing history yet. Receipts from Stripe will show up here after your first purchase.
          </p>
        ) : (
          <div className="wallet-settings__history-table" role="table" aria-label="Billing history">
            <div className="wallet-settings__history-row wallet-settings__history-row--header" role="row">
              <span className="wallet-settings__history-cell" role="columnheader">
                Date
              </span>
              <span className="wallet-settings__history-cell" role="columnheader">
                Invoice Number
              </span>
              <span className="wallet-settings__history-cell" role="columnheader">
                Amount
              </span>
              <span
                className="wallet-settings__history-cell wallet-settings__history-cell--action"
                role="columnheader"
              >
                View Detail
              </span>
            </div>

            {wallet.invoices.map((invoice) => {
              const amount =
                invoice.status === "paid"
                  ? invoice.amountPaidCents
                  : invoice.amountDueCents;

              return (
                <div
                  key={invoice.id}
                  className="wallet-settings__history-row"
                  role="row"
                >
                  <span className="wallet-settings__history-cell" role="cell">
                    {formatInvoiceDate(invoice)}
                  </span>
                  <span className="wallet-settings__history-cell" role="cell">
                    {formatInvoiceNumber(invoice)}
                  </span>
                  <span className="wallet-settings__history-cell" role="cell">
                    {formatWalletAmount(amount, invoice.currency)}
                  </span>
                  <span
                    className="wallet-settings__history-cell wallet-settings__history-cell--action"
                    role="cell"
                  >
                    <button
                      type="button"
                      className={cn("wallet-settings__link")}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      View Detail
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>

      <UpdatePaymentMethodModal
        open={paymentMethodModalOpen}
        onClose={handleClosePaymentMethodModal}
        onSuccess={reload}
      />

      <DeletePaymentMethodsModal
        open={deletePaymentMethodsModalOpen}
        paymentMethods={wallet.paymentMethods}
        onClose={handleCloseDeletePaymentMethodsModal}
        onSuccess={reload}
      />

      <InvoiceDetailModal
        open={selectedInvoice !== null}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
