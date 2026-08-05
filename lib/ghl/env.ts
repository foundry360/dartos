/** GoHighLevel Private Integration (sub-account) credentials. */

export function isGhlConfigured(): boolean {
  return Boolean(
    process.env.GHL_PRIVATE_TOKEN?.trim() && process.env.GHL_LOCATION_ID?.trim(),
  );
}

export function getGhlPrivateToken(): string | null {
  return process.env.GHL_PRIVATE_TOKEN?.trim() || null;
}

export function getGhlLocationId(): string | null {
  return process.env.GHL_LOCATION_ID?.trim() || null;
}

/** Optional custom field id for subscription plan text in GHL. */
export function getGhlSubscriptionCustomFieldId(): string | null {
  return process.env.GHL_CUSTOM_FIELD_SUBSCRIPTION_ID?.trim() || null;
}
