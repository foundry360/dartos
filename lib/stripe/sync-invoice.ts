import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";
import type { InvoiceStatus } from "@/types/wallet";

const INVOICE_LIST_LIMIT = 24;

function toIsoFromUnix(timestamp: number | null | undefined): string | null {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function mapInvoiceStatus(status: Stripe.Invoice.Status): InvoiceStatus {
  return status as InvoiceStatus;
}

function resolveInvoiceDescription(invoice: Stripe.Invoice): string | null {
  if (invoice.description) {
    return invoice.description;
  }

  return invoice.lines?.data[0]?.description ?? null;
}

function buildInvoiceRow(userId: string, invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    throw new Error("Invoice is missing customer.");
  }

  return {
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    number: invoice.number,
    status: mapInvoiceStatus(invoice.status ?? "open"),
    amount_due_cents: invoice.amount_due,
    amount_paid_cents: invoice.amount_paid,
    currency: invoice.currency,
    description: resolveInvoiceDescription(invoice),
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf_url: invoice.invoice_pdf ?? null,
    period_start: toIsoFromUnix(invoice.period_start),
    period_end: toIsoFromUnix(invoice.period_end),
    paid_at: toIsoFromUnix(invoice.status_transitions?.paid_at),
    created_at: toIsoFromUnix(invoice.created) ?? new Date().toISOString(),
  };
}

export async function upsertInvoiceFromStripe(
  admin: SupabaseClient<Database>,
  userId: string,
  invoice: Stripe.Invoice,
) {
  if (invoice.status === "draft") {
    return;
  }

  const { error } = await admin.from("invoices").upsert(buildInvoiceRow(userId, invoice), {
    onConflict: "stripe_invoice_id",
  });

  if (error) {
    throw error;
  }
}

export async function syncInvoicesForCustomer(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  stripeCustomerId: string,
) {
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit: INVOICE_LIST_LIMIT,
  });

  for (const invoice of invoices.data) {
    await upsertInvoiceFromStripe(admin, userId, invoice);
  }
}
