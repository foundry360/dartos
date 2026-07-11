import { NextResponse } from "next/server";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { syncPaymentMethodsForCustomer } from "@/lib/stripe/sync-payment-method";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
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
    const customer = await fetchBillingCustomerForUser(admin, user.id);

    if (!customer) {
      return NextResponse.json({ synced: false });
    }

    await syncPaymentMethodsForCustomer(stripe, admin, user.id, customer.stripeCustomerId);

    return NextResponse.json({ synced: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync payment methods.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
