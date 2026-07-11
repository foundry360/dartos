import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";

export async function getOrCreateStripeCustomerId(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
): Promise<string> {
  const existing = await fetchBillingCustomerForUser(admin, userId);

  if (existing) {
    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  const { error } = await admin.from("billing_customers").insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  });

  if (error) {
    throw error;
  }

  return customer.id;
}
