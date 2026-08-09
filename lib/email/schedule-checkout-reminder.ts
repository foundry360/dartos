import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSubscribePath } from "@/features/onboarding/lib/onboarding-path";
import {
  getCheckoutReminderFirstName,
  renderCheckoutReminderEmailHtml,
} from "@/lib/email/checkout-reminder-template";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { cancelResendEmail, isResendConfigured, scheduleResendEmail } from "@/lib/email/resend";
import { getAppSiteUrl } from "@/lib/email/site-url";
import { createCheckoutReminderUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import type { Database } from "@/lib/supabase/database.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CHECKOUT_REMINDER_DELAY_MS = 3 * MS_PER_DAY;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
/** Skip historical members; only recently created accounts get the nudge. */
const MAX_ACCOUNT_AGE_FOR_SCHEDULE_MS = 5 * MS_PER_DAY;

type AdminClient = SupabaseClient<Database>;

export type ScheduleCheckoutReminderResult =
  | { status: "scheduled"; emailId: string; scheduledAt: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

function resolveSendAt(createdAt: string, now = new Date()): Date {
  const createdMs = Date.parse(createdAt);
  const target = Number.isFinite(createdMs)
    ? new Date(createdMs + CHECKOUT_REMINDER_DELAY_MS)
    : new Date(now.getTime() + CHECKOUT_REMINDER_DELAY_MS);

  const earliest = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS);
  return target.getTime() > earliest.getTime() ? target : earliest;
}

export async function scheduleMemberCheckoutReminderEmail(
  admin: AdminClient,
  userId: string,
  email: string | null | undefined,
): Promise<ScheduleCheckoutReminderResult> {
  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    return { status: "skipped", reason: "User has no email address." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "account_kind, display_name, created_at, checkout_reminder_email_id, checkout_reminder_email_scheduled_at, checkout_reminder_email_opt_out, deactivated_at",
    )
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

  // Matches GHL subscription:None — free players get subscription:Free Player instead.
  if (profile.account_kind !== "member") {
    return { status: "skipped", reason: "Not a member account." };
  }

  if (profile.checkout_reminder_email_opt_out) {
    return { status: "skipped", reason: "User opted out of checkout reminder emails." };
  }

  if (profile.checkout_reminder_email_id) {
    return {
      status: "skipped",
      reason: "Checkout reminder email already scheduled.",
    };
  }

  const createdMs = Date.parse(profile.created_at);
  if (
    Number.isFinite(createdMs) &&
    Date.now() - createdMs > MAX_ACCOUNT_AGE_FOR_SCHEDULE_MS
  ) {
    return { status: "skipped", reason: "Account too old for checkout reminder email." };
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (subscription?.plan_name?.trim()) {
    return { status: "skipped", reason: "User already has a subscription." };
  }

  const siteUrl = getAppSiteUrl();
  const scheduledAt = resolveSendAt(profile.created_at);
  const unsubscribeToken = createCheckoutReminderUnsubscribeToken(userId);
  const html = renderCheckoutReminderEmailHtml({
    firstName: getCheckoutReminderFirstName(profile.display_name),
    checkoutLink: `${siteUrl}${buildSubscribePath()}`,
    unsubscribeLink: `${siteUrl}/api/emails/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
    logoUrl: EMAIL_LOGO_CID_SRC,
  });

  const { id } = await scheduleResendEmail({
    to: trimmedEmail,
    subject: "Finish setting up your VectorOS account",
    html,
    scheduledAt,
    attachments: [getEmailLogoAttachment()],
    tags: [
      { name: "category", value: "checkout_reminder" },
      { name: "account_kind", value: "member" },
    ],
  });

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({
      checkout_reminder_email_id: id,
      checkout_reminder_email_scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", userId)
    .is("checkout_reminder_email_id", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    await cancelResendEmail(id).catch(() => undefined);
    throw new Error(updateError.message);
  }

  if (!updated) {
    await cancelResendEmail(id).catch(() => undefined);
    return {
      status: "skipped",
      reason: "Checkout reminder email already scheduled.",
    };
  }

  return {
    status: "scheduled",
    emailId: id,
    scheduledAt: scheduledAt.toISOString(),
  };
}

export async function cancelMemberCheckoutReminderEmail(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("checkout_reminder_email_id")
    .eq("id", userId)
    .maybeSingle();

  const emailId = profile?.checkout_reminder_email_id;
  if (!emailId) {
    return;
  }

  await cancelResendEmail(emailId);

  await admin
    .from("profiles")
    .update({
      checkout_reminder_email_id: null,
      checkout_reminder_email_scheduled_at: null,
    })
    .eq("id", userId);
}

export async function optOutMemberCheckoutReminderEmail(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  await cancelMemberCheckoutReminderEmail(admin, userId);

  await admin
    .from("profiles")
    .update({
      checkout_reminder_email_opt_out: true,
      checkout_reminder_email_id: null,
      checkout_reminder_email_scheduled_at: null,
    })
    .eq("id", userId);
}
