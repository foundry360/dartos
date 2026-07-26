import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { isResendConfigured, sendResendEmail } from "@/lib/email/resend";
import { getAppSiteUrl } from "@/lib/email/site-url";
import {
  getWelcomeFirstName,
  renderWelcomeEmailHtml,
} from "@/lib/email/welcome-template";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;
type WelcomePlanId = Extract<SubscriptionPlanId, "club" | "elite">;

export function isWelcomeEmailPlan(planId: SubscriptionPlanId | null): planId is WelcomePlanId {
  return planId === "club" || planId === "elite";
}

export type SendWelcomeEmailResult =
  | { status: "sent"; emailId: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

export async function sendPaidMemberWelcomeEmail(
  admin: AdminClient,
  userId: string,
  planId: WelcomePlanId,
): Promise<SendWelcomeEmailResult> {
  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("display_name, welcome_email_id, welcome_email_sent_at, deactivated_at")
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

  if (profile.welcome_email_id || profile.welcome_email_sent_at) {
    return { status: "skipped", reason: "Welcome email already sent." };
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

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("profiles")
    .update({ welcome_email_sent_at: claimedAt })
    .eq("id", userId)
    .is("welcome_email_sent_at", null)
    .is("welcome_email_id", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimed) {
    return { status: "skipped", reason: "Welcome email already sent." };
  }

  const siteUrl = getAppSiteUrl();

  try {
    const { id } = await sendResendEmail({
      to: email,
      subject: "Welcome to VectorOS!",
      html: renderWelcomeEmailHtml({
        firstName: getWelcomeFirstName(profile.display_name),
        planId,
        openAppLink: `${siteUrl}${APP_HOME_PATH}`,
        logoUrl: EMAIL_LOGO_CID_SRC,
      }),
      attachments: [getEmailLogoAttachment()],
      tags: [
        { name: "category", value: "welcome" },
        { name: "plan", value: planId },
      ],
    });

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        welcome_email_id: id,
        welcome_email_sent_at: claimedAt,
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { status: "sent", emailId: id };
  } catch (error) {
    await admin
      .from("profiles")
      .update({
        welcome_email_id: null,
        welcome_email_sent_at: null,
      })
      .eq("id", userId)
      .eq("welcome_email_sent_at", claimedAt);

    throw error;
  }
}
