import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/env";
import { getStripeClient } from "@/lib/stripe/server";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface DeletePaymentMethodsBody {
  paymentMethodIds?: string[] | null;
}

function isDeletablePaymentMethod(row: {
  is_default: boolean;
  is_active: boolean;
}): boolean {
  return !row.is_default || !row.is_active;
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

  let body: DeletePaymentMethodsBody = {};

  try {
    body = (await request.json()) as DeletePaymentMethodsBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const paymentMethodIds = Array.from(
    new Set((body.paymentMethodIds ?? []).map((id) => id.trim()).filter(Boolean)),
  );

  if (paymentMethodIds.length === 0) {
    return NextResponse.json({ error: "Select at least one inactive card to delete." }, { status: 400 });
  }

  try {
    const customer = await fetchBillingCustomerForUser(admin, user.id);

    if (!customer) {
      return NextResponse.json({ error: "Billing customer not found." }, { status: 404 });
    }

    const { data: storedPaymentMethods, error: storedPaymentMethodsError } = await admin
      .from("payment_methods")
      .select("stripe_payment_method_id, is_default, is_active")
      .eq("user_id", user.id)
      .in("stripe_payment_method_id", paymentMethodIds);

    if (storedPaymentMethodsError) {
      throw storedPaymentMethodsError;
    }

    if ((storedPaymentMethods ?? []).length !== paymentMethodIds.length) {
      return NextResponse.json({ error: "One or more payment methods were not found." }, { status: 404 });
    }

    const activePaymentMethod = (storedPaymentMethods ?? []).find(
      (row) => !isDeletablePaymentMethod(row),
    );

    if (activePaymentMethod) {
      return NextResponse.json(
        { error: "Only inactive payment methods can be deleted." },
        { status: 400 },
      );
    }

    for (const paymentMethodId of paymentMethodIds) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        const attachedCustomerId =
          typeof paymentMethod.customer === "string"
            ? paymentMethod.customer
            : paymentMethod.customer?.id;

        if (attachedCustomerId === customer.stripeCustomerId) {
          await stripe.paymentMethods.detach(paymentMethodId);
        }
      } catch {
        // Already detached or removed from Stripe — continue deleting local record.
      }
    }

    const { error: deleteError } = await admin
      .from("payment_methods")
      .delete()
      .eq("user_id", user.id)
      .in("stripe_payment_method_id", paymentMethodIds);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true, deletedCount: paymentMethodIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete payment methods.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
