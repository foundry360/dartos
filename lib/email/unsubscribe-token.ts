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

export function createTrialOfferUnsubscribeToken(userId: string): string {
  const payload = `trial-offer:${userId}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${signPayload(payload)}`;
}

export function verifyTrialOfferUnsubscribeToken(token: string): string | null {
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

  if (!payload.startsWith("trial-offer:")) {
    return null;
  }

  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  const userId = payload.slice("trial-offer:".length).trim();
  return userId || null;
}
