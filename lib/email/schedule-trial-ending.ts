import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { cancelResendEmail, isResendConfigured, scheduleResendEmail } from "@/lib/email/resend";
import { getAppSiteUrl } from "@/lib/email/site-url";
import {
  getTrialEndingFirstName,
  renderTrialEndingEmailHtml,
  TRIAL_ENDING_REMINDER_DAYS_LEFT,
  TRIAL_ENDING_REMINDER_DELAY_DAYS,
} from "@/lib/email/trial-ending-template";
import type { Database } from "@/lib/supabase/database.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;

type AdminClient = SupabaseClient<Database>;
type TrialPlanId = Extract<SubscriptionPlanId, "club" | "elite">;

export type ScheduleTrialEndingResult =
  | { status: "scheduled"; emailId: string; scheduledAt: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

function resolveSendAt(trialStartedAt: Date, trialEndsAt: Date | null, now = new Date()): Date | null {
  const target = new Date(trialStartedAt.getTime() + TRIAL_ENDING_REMINDER_DELAY_DAYS * MS_PER_DAY);

  if (trialEndsAt && trialEndsAt.getTime() <= now.getTime()) {
    return null;
  }

  if (trialEndsAt && target.getTime() >= trialEndsAt.getTime()) {
    return null;
  }

  const earliest = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS);
  if (target.getTime() <= now.getTime()) {
    // Missed the day-4 window; only send soon if trial still has ~3 days left.
    if (!trialEndsAt) {
      return null;
    }
    const msLeft = trialEndsAt.getTime() - now.getTime();
    const threeDaysMs = TRIAL_ENDING_REMINDER_DAYS_LEFT * MS_PER_DAY;
    if (msLeft < threeDaysMs - MS_PER_DAY || msLeft > threeDaysMs + MS_PER_DAY) {
      return null;
    }
    return earliest;
  }

  return target.getTime() > earliest.getTime() ? target : earliest;
}

export async function scheduleTrialEndingReminderEmail(
  admin: AdminClient,
  userId: string,
  planId: TrialPlanId,
  trialStartedAt: Date,
  trialEndsAt: Date | null,
): Promise<ScheduleTrialEndingResult> {
  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "display_name, trial_ending_email_id, trial_ending_email_scheduled_at, deactivated_at",
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

  if (profile.trial_ending_email_id || profile.trial_ending_email_scheduled_at) {
    return { status: "skipped", reason: "Trial ending reminder already scheduled." };
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

  const scheduledAt = resolveSendAt(trialStartedAt, trialEndsAt);
  if (!scheduledAt) {
    return { status: "skipped", reason: "Trial ending reminder window has passed." };
  }

  const scheduledAtIso = scheduledAt.toISOString();

  // Claim the schedule slot before calling Resend so concurrent Stripe webhooks
  // cannot create two scheduled emails.
  const { data: claimed, error: claimError } = await admin
    .from("profiles")
    .update({
      trial_ending_email_scheduled_at: scheduledAtIso,
    })
    .eq("id", userId)
    .is("trial_ending_email_id", null)
    .is("trial_ending_email_scheduled_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimed) {
    return { status: "skipped", reason: "Trial ending reminder already scheduled." };
  }

  const siteUrl = getAppSiteUrl();

  try {
    const { id } = await scheduleResendEmail({
      to: email,
      subject: `Your VectorOS trial ends in ${TRIAL_ENDING_REMINDER_DAYS_LEFT} days`,
      html: renderTrialEndingEmailHtml({
        firstName: getTrialEndingFirstName(profile.display_name),
        planId,
        openAppLink: `${siteUrl}${APP_HOME_PATH}`,
        logoUrl: EMAIL_LOGO_CID_SRC,
      }),
      scheduledAt,
      attachments: [getEmailLogoAttachment()],
      tags: [
        { name: "category", value: "trial_ending" },
        { name: "plan", value: planId },
      ],
    });

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        trial_ending_email_id: id,
        trial_ending_email_scheduled_at: scheduledAtIso,
      })
      .eq("id", userId)
      .is("trial_ending_email_id", null);

    if (updateError) {
      await cancelResendEmail(id).catch(() => undefined);
      await admin
        .from("profiles")
        .update({
          trial_ending_email_id: null,
          trial_ending_email_scheduled_at: null,
        })
        .eq("id", userId)
        .is("trial_ending_email_id", null);
      throw new Error(updateError.message);
    }

    return {
      status: "scheduled",
      emailId: id,
      scheduledAt: scheduledAtIso,
    };
  } catch (error) {
    await admin
      .from("profiles")
      .update({
        trial_ending_email_id: null,
        trial_ending_email_scheduled_at: null,
      })
      .eq("id", userId)
      .is("trial_ending_email_id", null);
    throw error;
  }
}

export async function cancelTrialEndingReminderEmail(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_ending_email_id")
    .eq("id", userId)
    .maybeSingle();

  const emailId = profile?.trial_ending_email_id;
  if (!emailId) {
    return;
  }

  await cancelResendEmail(emailId);

  await admin
    .from("profiles")
    .update({
      trial_ending_email_id: null,
      trial_ending_email_scheduled_at: null,
    })
    .eq("id", userId);
}
