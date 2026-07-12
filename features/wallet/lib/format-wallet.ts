import type {
  InvoiceStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  WalletInvoice,
  WalletPaymentMethod,
  WalletSubscription,
} from "@/types/wallet";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  const code = currency.toUpperCase();
  const cached = currencyFormatters.get(code);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
  });
  currencyFormatters.set(code, formatter);
  return formatter;
}

export function formatWalletAmount(cents: number, currency = "usd"): string {
  return getCurrencyFormatter(currency).format(cents / 100);
}

export function formatPaymentMethodLabel(method: WalletPaymentMethod): string {
  if (method.type === "card") {
    const brand = method.brand ? capitalize(method.brand) : "Card";
    const last4 = method.last4 ?? "????";
    return `${brand} •••• ${last4}`;
  }

  if (method.type === "us_bank_account") {
    return `Bank account •••• ${method.last4 ?? "????"}`;
  }

  return "Link";
}

export function formatPaymentMethodExpiry(method: WalletPaymentMethod): string | null {
  if (method.type !== "card" || method.expMonth == null || method.expYear == null) {
    return null;
  }

  const month = String(method.expMonth).padStart(2, "0");
  const year = String(method.expYear).slice(-2);
  return `Expires ${month}/${year}`;
}

export function isPaymentMethodInactive(method: WalletPaymentMethod): boolean {
  return !method.isDefault || !method.isActive;
}

export function formatInvoiceStatus(status: InvoiceStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "open":
      return "Open";
    case "paid":
      return "Paid";
    case "void":
      return "Void";
    case "uncollectible":
      return "Uncollectible";
    default:
      return status;
  }
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  switch (status) {
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    case "trialing":
      return "Trial";
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "paused":
      return "Paused";
    default:
      return status;
  }
}

export function formatSubscriptionPrice(
  subscription: WalletSubscription,
): string | null {
  if (subscription.amountCents <= 0) {
    return null;
  }

  const amount = formatWalletAmount(subscription.amountCents, subscription.currency);

  if (!subscription.interval) {
    return amount;
  }

  const intervalLabel =
    subscription.interval === "month"
      ? "mo"
      : subscription.interval === "year"
        ? "yr"
        : subscription.interval;

  return `${amount}/${intervalLabel}`;
}

export function formatSubscriptionRenewal(subscription: WalletSubscription): string | null {
  if (!subscription.currentPeriodEnd) {
    return null;
  }

  const endDate = new Date(subscription.currentPeriodEnd);
  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  const formatted = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (subscription.cancelAtPeriodEnd || subscription.status === "canceled") {
    return `Ends ${formatted}`;
  }

  return `Renews ${formatted}`;
}

function formatWalletDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatSubscriptionInterval(
  interval: SubscriptionInterval | null,
): string | null {
  switch (interval) {
    case "day":
      return "Daily";
    case "week":
      return "Weekly";
    case "month":
      return "Monthly";
    case "year":
      return "Yearly";
    default:
      return null;
  }
}

export function formatBillingPeriodRange(subscription: WalletSubscription): string | null {
  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    return null;
  }

  const start = formatWalletDate(subscription.currentPeriodStart);
  const end = formatWalletDate(subscription.currentPeriodEnd);

  if (!start || !end) {
    return null;
  }

  return `${start} – ${end}`;
}

export function formatInvoiceDate(invoice: WalletInvoice): string {
  const source = invoice.paidAt ?? invoice.createdAt;
  return formatWalletDate(source) ?? "—";
}

export function formatInvoiceNumber(invoice: WalletInvoice): string {
  if (invoice.number) {
    return invoice.number;
  }

  return invoice.stripeInvoiceId.slice(-8).toUpperCase();
}

export function formatInvoiceBillingPeriod(invoice: WalletInvoice): string | null {
  if (!invoice.periodStart || !invoice.periodEnd) {
    return null;
  }

  const start = formatWalletDate(invoice.periodStart);
  const end = formatWalletDate(invoice.periodEnd);

  if (!start || !end) {
    return null;
  }

  return `${start} – ${end}`;
}

export function getInvoiceDisplayAmountCents(invoice: WalletInvoice): number {
  return invoice.status === "paid" ? invoice.amountPaidCents : invoice.amountDueCents;
}

export function getInvoiceDetailUrl(invoice: WalletInvoice): string | null {
  return invoice.hostedInvoiceUrl ?? invoice.invoicePdfUrl;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
