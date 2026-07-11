import type Stripe from "stripe";
import { isActiveSubscriptionStatus } from "@/lib/subscription/status";

export async function setDefaultPaymentMethodForCustomer(
  stripe: Stripe,
  stripeCustomerId: string,
  paymentMethodId: string,
) {
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 5,
  });

  for (const subscription of subscriptions.data) {
    if (!isActiveSubscriptionStatus(subscription.status)) {
      continue;
    }

    await stripe.subscriptions.update(subscription.id, {
      default_payment_method: paymentMethodId,
    });
  }
}
