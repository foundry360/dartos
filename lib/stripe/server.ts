import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/stripe/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
