import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/env";
import {
  cancelSubscriptionAtPeriodEnd,
  fetchManageableSubscription,
  SubscriptionManagementError,
} from "@/lib/stripe/manage-user-subscription";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured on the server." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!stripe || !admin || !supabase) {
    return NextResponse.json({ error: "Billing services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const subscription = await fetchManageableSubscription(admin, user.id);
    await cancelSubscriptionAtPeriodEnd(stripe, admin, user.id, subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SubscriptionManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
