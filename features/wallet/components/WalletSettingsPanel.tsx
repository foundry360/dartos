"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  formatBillingPeriodRange,
  formatInvoiceDate,
  formatInvoiceNumber,
  formatPaymentMethodExpiry,
  formatPaymentMethodLabel,
  formatSubscriptionInterval,
  formatSubscriptionPrice,
  formatSubscriptionRenewal,
  formatSubscriptionStatus,
  formatWalletAmount,
  getInvoiceDetailUrl,
} from "@/features/wallet/lib/format-wallet";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

export function WalletSettingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const { wallet, loading, error, reload } = useWalletData();

  if (!isSupabaseConfigured()) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Wallet</h3>
        <p className="settings-panel__subdescription">
          Connect Supabase to sync billing details across devices.
        </p>
      </GlassPanel>
    );
  }

  if (authLoading || loading) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Wallet</h3>
        <p className="settings-panel__subdescription">Loading wallet…</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel>
        <h3 className="settings-panel__subheading text-2xl font-bold">Wallet</h3>
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
        <div className="wallet-settings__section-header">
          <h4 className="wallet-settings__section-title">Subscription</h4>
          <TouchButton size="md" disabled>
            Manage
          </TouchButton>
        </div>

        {!wallet.subscription ? (
          <p className="wallet-settings__empty">
            No active subscription. Your Pro plan will appear here after checkout.
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
              <span className="wallet-settings__badge">Current</span>
            ) : null}
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="wallet-settings__section">
        <div className="wallet-settings__section-header">
          <h4 className="wallet-settings__section-title">Payment methods</h4>
          <TouchButton size="md" disabled>
            Update
          </TouchButton>
        </div>

        {wallet.paymentMethods.length === 0 ? (
          <p className="wallet-settings__empty">
            No saved payment methods yet. Cards added through Stripe Checkout will appear here.
          </p>
        ) : (
          <ul className="wallet-settings__list">
            {wallet.paymentMethods.map((method) => {
              const expiry = formatPaymentMethodExpiry(method);

              return (
                <li key={method.id} className="wallet-settings__item">
                  <div className="wallet-settings__item-main">
                    <p className="wallet-settings__item-title">{formatPaymentMethodLabel(method)}</p>
                    {expiry ? <p className="wallet-settings__item-meta">{expiry}</p> : null}
                  </div>
                  {method.isDefault ? (
                    <span className="wallet-settings__badge">Default</span>
                  ) : null}
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
              const detailUrl = getInvoiceDetailUrl(invoice);

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
                    {detailUrl ? (
                      <a
                        href={detailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("wallet-settings__link")}
                      >
                        View Detail
                      </a>
                    ) : (
                      <span className="wallet-settings__history-muted">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
