"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  formatInvoiceStatus,
  formatPaymentMethodExpiry,
  formatPaymentMethodLabel,
  formatWalletAmount,
} from "@/features/wallet/lib/format-wallet";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { isStripeConfigured } from "@/lib/stripe/env";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

export function WalletSettingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const { wallet, loading, error, reload } = useWalletData();
  const stripeReady = isStripeConfigured();

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
          Sign in to manage payment methods and view invoices.
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
      <GlassPanel className="wallet-settings__intro">
        <h3 className="settings-panel__subheading text-2xl font-bold">Wallet</h3>
        <p className="settings-panel__subdescription">
          Save payment methods and review invoices for league fees, subscriptions, and other
          DartScorer purchases.
        </p>
        {!stripeReady ? (
          <p className="wallet-settings__notice">
            Stripe is not configured yet. Add keys to enable checkout and saved cards.
          </p>
        ) : null}
      </GlassPanel>

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
          <h4 className="wallet-settings__section-title">Payment methods</h4>
          <TouchButton size="md" disabled>
            Add card
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
        <h4 className="wallet-settings__section-title">Invoices</h4>

        {wallet.invoices.length === 0 ? (
          <p className="wallet-settings__empty">
            No invoices yet. Receipts from Stripe will show up here after your first purchase.
          </p>
        ) : (
          <ul className="wallet-settings__list">
            {wallet.invoices.map((invoice) => {
              const amount =
                invoice.status === "paid"
                  ? invoice.amountPaidCents
                  : invoice.amountDueCents;
              const invoiceLabel = invoice.number ?? invoice.stripeInvoiceId.slice(-8).toUpperCase();

              return (
                <li key={invoice.id} className="wallet-settings__item wallet-settings__item--invoice">
                  <div className="wallet-settings__item-main">
                    <p className="wallet-settings__item-title">
                      {invoice.description ?? `Invoice ${invoiceLabel}`}
                    </p>
                    <p className="wallet-settings__item-meta">
                      {formatWalletAmount(amount, invoice.currency)} ·{" "}
                      {formatInvoiceStatus(invoice.status)}
                    </p>
                  </div>
                  {invoice.hostedInvoiceUrl ? (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn("wallet-settings__link")}
                    >
                      View
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
