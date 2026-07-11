import { NextResponse } from "next/server";
import { setDefaultPaymentMethodForCustomer } from "@/lib/stripe/set-default-payment-method";
import { syncPaymentMethodsForCustomer } from "@/lib/stripe/sync-payment-method";
import { isStripeConfigured } from "@/lib/stripe/env";
import { getStripeClient } from "@/lib/stripe/server";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface ActivatePaymentMethodBody {
  paymentMethodId?: string | null;
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

  let body: ActivatePaymentMethodBody = {};

  try {
    body = (await request.json()) as ActivatePaymentMethodBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const paymentMethodId = body.paymentMethodId?.trim();

  if (!paymentMethodId) {
    return NextResponse.json({ error: "Payment method is required." }, { status: 400 });
  }

  try {
    const customer = await fetchBillingCustomerForUser(admin, user.id);

    if (!customer) {
      return NextResponse.json({ error: "Billing customer not found." }, { status: 404 });
    }

    const { data: storedPaymentMethod, error: storedPaymentMethodError } = await admin
      .from("payment_methods")
      .select("stripe_payment_method_id")
      .eq("user_id", user.id)
      .eq("stripe_payment_method_id", paymentMethodId)
      .maybeSingle();

    if (storedPaymentMethodError) {
      throw storedPaymentMethodError;
    }

    if (!storedPaymentMethod) {
      return NextResponse.json({ error: "Payment method not found." }, { status: 404 });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const attachedCustomerId =
      typeof paymentMethod.customer === "string"
        ? paymentMethod.customer
        : paymentMethod.customer?.id;

    if (!attachedCustomerId) {
      return NextResponse.json(
        {
          error:
            "This card was removed from billing and cannot be turned back on. Delete it and add a new card if needed.",
        },
        { status: 400 },
      );
    }

    if (attachedCustomerId !== customer.stripeCustomerId) {
      return NextResponse.json({ error: "Payment method is not authorized." }, { status: 403 });
    }

    await setDefaultPaymentMethodForCustomer(
      stripe,
      customer.stripeCustomerId,
      paymentMethodId,
    );
    await syncPaymentMethodsForCustomer(stripe, admin, user.id, customer.stripeCustomerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate payment method.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
