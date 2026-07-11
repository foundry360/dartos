import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/env";
import {
  resolveUserIdForStripeCustomer,
  retrieveSubscriptionForSync,
  upsertSubscriptionFromStripe,
} from "@/lib/stripe/sync-subscription";
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

        if (subscriptionId) {
          await syncSubscription(admin, stripe, subscriptionId, session.metadata?.userId);
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
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = resolveSubscriptionIdFromInvoice(invoice);

        if (subscriptionId) {
          await syncSubscription(admin, stripe, subscriptionId);
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
