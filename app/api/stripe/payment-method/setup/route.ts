import { NextResponse } from "next/server";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/billing-customer";
import { resolveStripeCustomerName } from "@/lib/stripe/customer-name";
import { isStripeConfigured } from "@/lib/stripe/env";
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

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const customerId = await getOrCreateStripeCustomerId(
      stripe,
      admin,
      user.id,
      user.email,
      resolveStripeCustomerName(user),
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    if (!setupIntent.client_secret) {
      return NextResponse.json({ error: "Unable to start card update." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start card update.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
