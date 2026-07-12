import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getOrCreateStripeCustomerId } from "@/lib/stripe/billing-customer";
import { resolveStripeCustomerName } from "@/lib/stripe/customer-name";
import { isStripeConfigured } from "@/lib/stripe/env";
import { isStripeBillingConfigured } from "@/lib/stripe/prices";
import { getRequestOrigin } from "@/lib/stripe/request-origin";
import { getStripeClient } from "@/lib/stripe/server";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PortalFlow = "payment_method_update";

interface PortalRequestBody {
  flow?: PortalFlow;
}

function buildBillingReturnUrl(origin: string): string {
  const returnUrl = new URL("/settings", origin);
  returnUrl.searchParams.set("section", "billing");
  return returnUrl.toString();
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured on the server." },
      { status: 503 },
    );
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

  let body: PortalRequestBody = {};

  try {
    body = (await request.json()) as PortalRequestBody;
  } catch {
    // Optional body — open the default billing portal.
  }

  try {
    const existingCustomer = await fetchBillingCustomerForUser(admin, user.id);
    const customerId =
      existingCustomer?.stripeCustomerId ??
      (await getOrCreateStripeCustomerId(
        stripe,
        admin,
        user.id,
        user.email,
        resolveStripeCustomerName(user),
      ));

    const origin = getRequestOrigin(request);
    const returnUrl = buildBillingReturnUrl(origin);

    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: returnUrl,
    };

    if (body.flow === "payment_method_update") {
      sessionParams.flow_data = {
        type: "payment_method_update",
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: returnUrl,
          },
        },
      };
    }

    const session = await stripe.billingPortal.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json({ error: "Unable to open billing portal." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
