import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSubscribePath } from "@/features/onboarding/lib/onboarding-path";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { cancelResendEmail, isResendConfigured, scheduleResendEmail } from "@/lib/email/resend";
import { getAppSiteUrl } from "@/lib/email/site-url";
import {
  getTrialOfferFirstName,
  renderTrialOfferEmailHtml,
} from "@/lib/email/trial-offer-template";
import { createTrialOfferUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";
import { userIsTrialEligible } from "@/lib/subscription/trial-eligibility";
import type { Database } from "@/lib/supabase/database.types";

const MS_PER_HOUR = 60 * 60 * 1000;
const TRIAL_OFFER_DELAY_MS = 24 * MS_PER_HOUR;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
/** Skip historical free accounts; only newly created players get the offer. */
const MAX_ACCOUNT_AGE_FOR_SCHEDULE_MS = 72 * MS_PER_HOUR;

type AdminClient = SupabaseClient<Database>;

export type ScheduleTrialOfferResult =
  | { status: "scheduled"; emailId: string; scheduledAt: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

function resolveSendAt(createdAt: string, now = new Date()): Date {
  const createdMs = Date.parse(createdAt);
  const target = Number.isFinite(createdMs)
    ? new Date(createdMs + TRIAL_OFFER_DELAY_MS)
    : new Date(now.getTime() + TRIAL_OFFER_DELAY_MS);

  const earliest = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS);
  return target.getTime() > earliest.getTime() ? target : earliest;
}

export async function schedulePlayerTrialOfferEmail(
  admin: AdminClient,
  userId: string,
  email: string | null | undefined,
): Promise<ScheduleTrialOfferResult> {
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
      "account_kind, display_name, created_at, trial_offer_email_id, trial_offer_email_scheduled_at, trial_offer_email_opt_out, deactivated_at",
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

  if (profile.account_kind !== "player") {
    return { status: "skipped", reason: "Not a free player account." };
  }

  if (profile.trial_offer_email_opt_out) {
    return { status: "skipped", reason: "User opted out of trial offer emails." };
  }

  if (profile.trial_offer_email_id) {
    return {
      status: "skipped",
      reason: "Trial offer email already scheduled.",
    };
  }

  const createdMs = Date.parse(profile.created_at);
  if (
    Number.isFinite(createdMs) &&
    Date.now() - createdMs > MAX_ACCOUNT_AGE_FOR_SCHEDULE_MS
  ) {
    return { status: "skipped", reason: "Account too old for trial offer email." };
  }

  const eligible = await userIsTrialEligible(admin, userId);
  if (!eligible) {
    return { status: "skipped", reason: "User is not trial eligible." };
  }

  const siteUrl = getAppSiteUrl();
  const scheduledAt = resolveSendAt(profile.created_at);
  const unsubscribeToken = createTrialOfferUnsubscribeToken(userId);
  const html = renderTrialOfferEmailHtml({
    firstName: getTrialOfferFirstName(profile.display_name),
    trialActivationLink: `${siteUrl}${buildSubscribePath()}`,
    unsubscribeLink: `${siteUrl}/api/emails/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
    logoUrl: EMAIL_LOGO_CID_SRC,
  });

  const { id } = await scheduleResendEmail({
    to: trimmedEmail,
    subject: `Your ${SUBSCRIPTION_TRIAL_DAYS}-day VectorOS free trial`,
    html,
    scheduledAt,
    attachments: [getEmailLogoAttachment()],
    tags: [
      { name: "category", value: "trial_offer" },
      { name: "account_kind", value: "player" },
    ],
  });

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({
      trial_offer_email_id: id,
      trial_offer_email_scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", userId)
    .is("trial_offer_email_id", null)
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
      reason: "Trial offer email already scheduled.",
    };
  }

  return {
    status: "scheduled",
    emailId: id,
    scheduledAt: scheduledAt.toISOString(),
  };
}

export async function cancelPlayerTrialOfferEmail(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_offer_email_id")
    .eq("id", userId)
    .maybeSingle();

  const emailId = profile?.trial_offer_email_id;
  if (!emailId) {
    return;
  }

  await cancelResendEmail(emailId);

  await admin
    .from("profiles")
    .update({
      trial_offer_email_id: null,
      trial_offer_email_scheduled_at: null,
    })
    .eq("id", userId);
}

export async function optOutPlayerTrialOfferEmail(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  await cancelPlayerTrialOfferEmail(admin, userId);

  await admin
    .from("profiles")
    .update({
      trial_offer_email_opt_out: true,
      trial_offer_email_id: null,
      trial_offer_email_scheduled_at: null,
    })
    .eq("id", userId);
}
