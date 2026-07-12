import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";
import { deactivateUserAccount } from "@/lib/account/account-status";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";

async function cancelStripeSubscriptionsForUser(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
) {
  const customer = await fetchBillingCustomerForUser(admin, userId);

  if (!customer) {
    return;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.stripeCustomerId,
    status: "all",
    limit: 20,
  });

  for (const subscription of subscriptions.data) {
    if (subscription.status !== "canceled") {
      await stripe.subscriptions.cancel(subscription.id);
    }
  }
}

export async function deactivateUserAccountWithBilling(
  admin: SupabaseClient<Database>,
  userId: string,
  options: { stripe?: Stripe | null } = {},
) {
  if (options.stripe) {
    await cancelStripeSubscriptionsForUser(options.stripe, admin, userId);
  }

  await deactivateUserAccount(admin, userId);
}
