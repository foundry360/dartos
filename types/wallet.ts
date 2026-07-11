export type PaymentMethodType = "card" | "us_bank_account" | "link";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type SubscriptionInterval = "day" | "week" | "month" | "year";

export interface BillingCustomer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletPaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  stripeCustomerId: string;
  type: PaymentMethodType;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletInvoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  number: string | null;
  status: InvoiceStatus;
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  description: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  planName: string;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  interval: SubscriptionInterval | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletSnapshot {
  customer: BillingCustomer | null;
  subscription: WalletSubscription | null;
  paymentMethods: WalletPaymentMethod[];
  invoices: WalletInvoice[];
}
