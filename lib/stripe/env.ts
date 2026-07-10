/** Publishable key for Stripe.js / Payment Element (client-safe). */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";

/** Secret key for server routes and webhooks — never expose to the client. */
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim() || "";

/** Webhook signing secret from Stripe Dashboard or `stripe listen`. */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";

export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PUBLISHABLE_KEY && STRIPE_SECRET_KEY);
}
