import type { InvoiceStatus, WalletPaymentMethod } from "@/types/wallet";

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

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
