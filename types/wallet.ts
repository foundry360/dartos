export type PaymentMethodType = "card" | "us_bank_account" | "link";

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

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

export interface WalletSnapshot {
  customer: BillingCustomer | null;
  paymentMethods: WalletPaymentMethod[];
  invoices: WalletInvoice[];
}
