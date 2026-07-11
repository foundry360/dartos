import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import type { Database } from "@/lib/supabase/database.types";
import { fetchBillingCustomerForUser } from "@/lib/supabase/queries/wallet";

export async function getOrCreateStripeCustomerId(
  stripe: Stripe,
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
  name?: string | null,
): Promise<string> {
  const resolvedName = name?.trim() || undefined;
  const existing = await fetchBillingCustomerForUser(admin, userId);

  if (existing) {
    if (resolvedName) {
      await stripe.customers.update(existing.stripeCustomerId, { name: resolvedName });
    }

    return existing.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    ...(resolvedName ? { name: resolvedName } : {}),
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
