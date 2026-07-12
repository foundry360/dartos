import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/env";
import {
  resolveUserIdForStripeCustomer,
  retrieveSubscriptionForSync,
  upsertSubscriptionFromStripe,
} from "@/lib/stripe/sync-subscription";
import { syncPaymentMethodsForCustomer } from "@/lib/stripe/sync-payment-method";
import { upsertInvoiceFromStripe, syncInvoicesForCustomer } from "@/lib/stripe/sync-invoice";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function syncSubscription(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  stripe: Stripe,
  subscriptionId: string,
  fallbackUserId?: string,
) {
  const subscription = await retrieveSubscriptionForSync(stripe, subscriptionId);
  const metadataUserId = subscription.metadata.userId;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const userId =
    metadataUserId ||
    fallbackUserId ||
    (await resolveUserIdForStripeCustomer(admin, customerId));

  if (!userId) {
    return;
  }

  await upsertSubscriptionFromStripe(admin, userId, subscription);
  await syncPaymentMethodsForCustomer(stripe, admin, userId, customerId);
  await syncInvoicesForCustomer(stripe, admin, userId, customerId);
}

async function syncPaymentMethods(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  stripe: Stripe,
  stripeCustomerId: string,
  fallbackUserId?: string,
) {
  const userId =
    fallbackUserId || (await resolveUserIdForStripeCustomer(admin, stripeCustomerId));

  if (!userId) {
    return;
  }

  await syncPaymentMethodsForCustomer(stripe, admin, userId, stripeCustomerId);
  await syncInvoicesForCustomer(stripe, admin, userId, stripeCustomerId);
}

function resolveSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscription = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }
  ).subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  return subscription?.id ?? null;
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const admin = createAdminClient();

  if (!stripe || !admin) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (subscriptionId) {
          await syncSubscription(admin, stripe, subscriptionId, session.metadata?.userId);
        } else if (customerId) {
          await syncPaymentMethods(admin, stripe, customerId, session.metadata?.userId);
        }

        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(admin, stripe, subscription.id, subscription.metadata.userId);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice.finalized":
      case "invoice.updated":
      case "invoice.voided": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = resolveSubscriptionIdFromInvoice(invoice);
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        const userId = customerId
          ? await resolveUserIdForStripeCustomer(admin, customerId)
          : null;

        if (userId) {
          await upsertInvoiceFromStripe(admin, userId, invoice);
        }

        if (subscriptionId) {
          await syncSubscription(admin, stripe, subscriptionId, userId ?? undefined);
        } else if (customerId) {
          await syncPaymentMethods(admin, stripe, customerId, userId ?? undefined);
        }

        break;
      }
      case "payment_method.attached":
      case "payment_method.detached":
      case "payment_method.updated":
      case "setup_intent.succeeded": {
        const object = event.data.object as Stripe.PaymentMethod | Stripe.SetupIntent;
        const customerId =
          "customer" in object
            ? typeof object.customer === "string"
              ? object.customer
              : object.customer?.id
            : null;

        if (customerId) {
          await syncPaymentMethods(admin, stripe, customerId);
        }

        break;
      }
      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;

        if (!customer.deleted) {
          await syncPaymentMethods(admin, stripe, customer.id, customer.metadata.userId);
        }

        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
