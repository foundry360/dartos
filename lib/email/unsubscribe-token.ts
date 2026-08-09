import { createHmac, timingSafeEqual } from "node:crypto";

function getUnsubscribeSecret(): string | null {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    null
  );
}

function signPayload(payload: string): string {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    throw new Error("No secret available to sign unsubscribe tokens.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSignedToken(kind: string, userId: string): string {
  const payload = `${kind}:${userId}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signPayload(payload)}`;
}

function verifySignedToken(token: string, kind: string): string | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const prefix = `${kind}:`;
  if (!payload.startsWith(prefix)) {
    return null;
  }

  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  const userId = payload.slice(prefix.length).trim();
  return userId || null;
}

export function createTrialOfferUnsubscribeToken(userId: string): string {
  return createSignedToken("trial-offer", userId);
}

export function verifyTrialOfferUnsubscribeToken(token: string): string | null {
  return verifySignedToken(token, "trial-offer");
}

export function createCheckoutReminderUnsubscribeToken(userId: string): string {
  return createSignedToken("checkout-reminder", userId);
}

export function verifyCheckoutReminderUnsubscribeToken(token: string): string | null {
  return verifySignedToken(token, "checkout-reminder");
}

export type LifecycleEmailUnsubscribeKind = "trial-offer" | "checkout-reminder";

export function verifyLifecycleEmailUnsubscribeToken(
  token: string,
): { kind: LifecycleEmailUnsubscribeKind; userId: string } | null {
  const trialOfferUserId = verifyTrialOfferUnsubscribeToken(token);
  if (trialOfferUserId) {
    return { kind: "trial-offer", userId: trialOfferUserId };
  }

  const checkoutReminderUserId = verifyCheckoutReminderUnsubscribeToken(token);
  if (checkoutReminderUserId) {
    return { kind: "checkout-reminder", userId: checkoutReminderUserId };
  }

  return null;
}
