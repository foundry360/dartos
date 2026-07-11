import { NextResponse } from "next/server";
import { setDefaultPaymentMethodForCustomer } from "@/lib/stripe/set-default-payment-method";
import { syncPaymentMethodsForCustomer } from "@/lib/stripe/sync-payment-method";
import { isStripeConfigured } from "@/lib/stripe/env";
import { getStripeClient } from "@/lib/stripe/server";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface CompletePaymentMethodBody {
  setupIntentId?: string | null;
}

function resolvePaymentMethodId(
  paymentMethod: string | { id: string } | null | undefined,
): string | null {
  if (!paymentMethod) {
    return null;
  }

  return typeof paymentMethod === "string" ? paymentMethod : paymentMethod.id;
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

  let body: CompletePaymentMethodBody = {};

  try {
    body = (await request.json()) as CompletePaymentMethodBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const setupIntentId = body.setupIntentId?.trim();

  if (!setupIntentId) {
    return NextResponse.json({ error: "Setup intent is required." }, { status: 400 });
  }

  try {
    const customer = await fetchBillingCustomerForUser(admin, user.id);

    if (!customer) {
      return NextResponse.json({ error: "Billing customer not found." }, { status: 404 });
    }

    let setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    const setupCustomerId =
      typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id;

    if (setupCustomerId !== customer.stripeCustomerId) {
      return NextResponse.json({ error: "Payment method update is not authorized." }, { status: 403 });
    }

    for (let attempt = 0; attempt < 5 && setupIntent.status === "processing"; attempt += 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
      setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    }

    if (setupIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Card update has not completed yet." }, { status: 400 });
    }

    const paymentMethodId = resolvePaymentMethodId(setupIntent.payment_method);

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Updated payment method was not found." }, { status: 400 });
    }

    await setDefaultPaymentMethodForCustomer(
      stripe,
      customer.stripeCustomerId,
      paymentMethodId,
    );
    await syncPaymentMethodsForCustomer(stripe, admin, user.id, customer.stripeCustomerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save payment method.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
