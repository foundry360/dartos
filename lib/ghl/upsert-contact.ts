import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getGhlLocationId,
  getGhlPrivateToken,
  getGhlSubscriptionCustomFieldId,
  isGhlConfigured,
} from "@/lib/ghl/env";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

const GHL_CONTACTS_UPSERT_URL = "https://services.leadconnectorhq.com/contacts/upsert";
const GHL_API_VERSION = "2021-07-28";

export type SyncGhlContactResult =
  | { status: "synced"; contactId?: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

function splitDisplayName(displayName: string | null | undefined): {
  firstName: string;
  lastName?: string;
  name: string;
} {
  const trimmed = displayName?.trim() || "";
  if (!trimmed) {
    return { firstName: "Player", name: "Player" };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0]!, name: parts[0]! };
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
    name: trimmed,
  };
}

function subscriptionLabel(planName: string | null, status: string | null): string {
  if (!planName) {
    return "None";
  }

  if (!status || status === "active") {
    return planName;
  }

  return `${planName} (${status})`;
}

async function upsertGhlContact(payload: {
  email: string;
  firstName: string;
  lastName?: string;
  name: string;
  subscription: string;
}): Promise<{ contactId?: string }> {
  const token = getGhlPrivateToken();
  const locationId = getGhlLocationId();

  if (!token || !locationId) {
    throw new Error("GoHighLevel is not configured.");
  }

  const customFieldId = getGhlSubscriptionCustomFieldId();
  const body: Record<string, unknown> = {
    locationId,
    email: payload.email,
    firstName: payload.firstName,
    name: payload.name,
    source: "VectorOS App",
    tags: ["vectoros-app", "active", `subscription:${payload.subscription}`],
  };

  if (payload.lastName) {
    body.lastName = payload.lastName;
  }

  if (customFieldId) {
    body.customFields = [{ id: customFieldId, field_value: payload.subscription }];
  }

  const response = await fetch(GHL_CONTACTS_UPSERT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `GoHighLevel upsert failed (${response.status})${detail ? `: ${detail}` : "."}`,
    );
  }

  const json = (await response.json().catch(() => null)) as
    | { contact?: { id?: string }; id?: string }
    | null;

  return { contactId: json?.contact?.id ?? json?.id };
}

/**
 * Upsert the user's name, email, and current subscription into GoHighLevel.
 * Safe to call repeatedly (upsert by email).
 */
export async function syncUserContactToGhl(
  admin: AdminClient,
  userId: string,
): Promise<SyncGhlContactResult> {
  if (!isGhlConfigured()) {
    return { status: "unavailable", reason: "GoHighLevel is not configured." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("display_name, account_kind, deactivated_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    return { status: "skipped", reason: "Profile not found." };
  }

  if (profile.deactivated_at) {
    return { status: "skipped", reason: "Account is deactivated." };
  }

  const {
    data: { user },
    error: userError,
  } = await admin.auth.admin.getUserById(userId);

  if (userError) {
    throw new Error(userError.message);
  }

  const email = user?.email?.trim().toLowerCase();
  if (!email) {
    return { status: "skipped", reason: "User has no email address." };
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const planName =
    subscription?.plan_name?.trim() ||
    (profile.account_kind === "player" ? "Free Player" : null);
  const subscriptionText = subscriptionLabel(
    planName,
    subscription?.status ?? null,
  );

  const names = splitDisplayName(profile.display_name);
  const { contactId } = await upsertGhlContact({
    email,
    firstName: names.firstName,
    lastName: names.lastName,
    name: names.name,
    subscription: subscriptionText,
  });

  return { status: "synced", contactId };
}
