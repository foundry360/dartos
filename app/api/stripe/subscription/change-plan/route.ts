import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/env";
import {
  changeSubscriptionPlan,
  fetchManageableSubscription,
  parseClubElitePlanId,
  SubscriptionManagementError,
} from "@/lib/stripe/manage-user-subscription";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface ChangePlanBody {
  planId?: string;
}

export async function POST(request: Request) {
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

  let body: ChangePlanBody;

  try {
    body = (await request.json()) as ChangePlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const planId = parseClubElitePlanId(body.planId);

  if (!planId) {
    return NextResponse.json({ error: "Choose Club or Elite." }, { status: 400 });
  }

  try {
    const subscription = await fetchManageableSubscription(admin, user.id);
    await changeSubscriptionPlan(stripe, admin, user.id, user, subscription, planId);

    return NextResponse.json({ success: true, planId });
  } catch (error) {
    if (error instanceof SubscriptionManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to change plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
