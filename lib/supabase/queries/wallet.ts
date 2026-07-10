import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  BillingCustomer,
  WalletInvoice,
  WalletPaymentMethod,
  WalletSnapshot,
} from "@/types/wallet";

type BillingCustomerRow = Database["public"]["Tables"]["billing_customers"]["Row"];
type PaymentMethodRow = Database["public"]["Tables"]["payment_methods"]["Row"];
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

function mapBillingCustomer(row: BillingCustomerRow): BillingCustomer {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentMethod(row: PaymentMethodRow): WalletPaymentMethod {
  return {
    id: row.id,
    userId: row.user_id,
    stripePaymentMethodId: row.stripe_payment_method_id,
    stripeCustomerId: row.stripe_customer_id,
    type: row.type as WalletPaymentMethod["type"],
    brand: row.brand,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row: InvoiceRow): WalletInvoice {
  return {
    id: row.id,
    userId: row.user_id,
    stripeInvoiceId: row.stripe_invoice_id,
    stripeCustomerId: row.stripe_customer_id,
    number: row.number,
    status: row.status as WalletInvoice["status"],
    amountDueCents: row.amount_due_cents,
    amountPaidCents: row.amount_paid_cents,
    currency: row.currency,
    description: row.description,
    hostedInvoiceUrl: row.hosted_invoice_url,
    invoicePdfUrl: row.invoice_pdf_url,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchBillingCustomerForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BillingCustomer | null> {
  const { data, error } = await supabase
    .from("billing_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapBillingCustomer(data) : null;
}

export async function fetchPaymentMethodsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<WalletPaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPaymentMethod);
}

export async function fetchInvoicesForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<WalletInvoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapInvoice);
}

export async function fetchWalletSnapshotForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<WalletSnapshot> {
  const [customer, paymentMethods, invoices] = await Promise.all([
    fetchBillingCustomerForUser(supabase, userId),
    fetchPaymentMethodsForUser(supabase, userId),
    fetchInvoicesForUser(supabase, userId),
  ]);

  return { customer, paymentMethods, invoices };
}
