import { NextResponse } from "next/server";
import { userHasActiveSubscription } from "@/lib/subscription/access";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { upsertSubscriptionFromStripe, retrieveSubscriptionForSync } from "@/lib/stripe/sync-subscription";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface SyncRequestBody {
  subscriptionId?: string | null;
  sessionId?: string | null;
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!stripe || !admin || !supabase) {
    return NextResponse.json({ active: false, error: "Billing services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ active: false, error: "Sign in required." }, { status: 401 });
  }

  let body: SyncRequestBody = {};

  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    // Optional body — fall back to syncing the latest customer subscription.
  }

  try {
    let subscriptionId = body.subscriptionId?.trim() || null;

    if (!subscriptionId && body.sessionId?.trim()) {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId.trim(), {
        expand: ["subscription"],
      });
      const subscription = session.subscription;

      subscriptionId =
        typeof subscription === "string" ? subscription : subscription?.id ?? null;
    }

    if (subscriptionId) {
      const subscription = await retrieveSubscriptionForSync(stripe, subscriptionId);
      await upsertSubscriptionFromStripe(admin, user.id, subscription);
    } else {
      const customer = await fetchBillingCustomerForUser(admin, user.id);

      if (customer) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.stripeCustomerId,
          status: "all",
          limit: 5,
        });

        const latestSubscription = subscriptions.data.sort(
          (left, right) => right.created - left.created,
        )[0];

        if (latestSubscription) {
          const subscription = await retrieveSubscriptionForSync(stripe, latestSubscription.id);
          await upsertSubscriptionFromStripe(admin, user.id, subscription);
        }
      }
    }

    const active = await userHasActiveSubscription(supabase, user.id);

    return NextResponse.json({ active });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync subscription.";
    return NextResponse.json({ active: false, error: message }, { status: 500 });
  }
}
