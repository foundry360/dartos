import type { SupabaseClient } from "@supabase/supabase-js";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { cancelResendEmail, isResendConfigured, scheduleResendEmail } from "@/lib/email/resend";
import {
  getCommunityInviteFirstName,
  renderCommunityInviteEmailHtml,
} from "@/lib/email/community-invite-template";
import type { Database } from "@/lib/supabase/database.types";

const MS_PER_HOUR = 60 * 60 * 1000;
/** Send the Discord community invite one day after the welcome email. */
export const COMMUNITY_INVITE_DELAY_MS = 24 * MS_PER_HOUR;
const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
/** If the 24h window already passed by more than this, do not backfill. */
const LATE_GRACE_MS = 2 * MS_PER_HOUR;

type AdminClient = SupabaseClient<Database>;

export const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/GsyUKxXVc";

export function getDiscordInviteUrl(): string {
  return (
    process.env.DISCORD_INVITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    DEFAULT_DISCORD_INVITE_URL
  );
}

export type ScheduleCommunityInviteResult =
  | { status: "scheduled"; emailId: string; scheduledAt: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

/**
 * @param welcomeSentAt - When the welcome email was sent. Null schedules from now
 *   (used for League Pro, which has no welcome email).
 */
function resolveSendAt(welcomeSentAt: string | null, now = new Date()): Date | null {
  const baseMs = welcomeSentAt ? Date.parse(welcomeSentAt) : now.getTime();
  const base = Number.isFinite(baseMs) ? new Date(baseMs) : now;
  const target = new Date(base.getTime() + COMMUNITY_INVITE_DELAY_MS);
  const earliest = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS);

  if (target.getTime() + LATE_GRACE_MS < now.getTime()) {
    return null;
  }

  return target.getTime() > earliest.getTime() ? target : earliest;
}

/**
 * Schedule the Discord community invite email.
 * - Club / Elite: 24h after welcome (`requireWelcome: true`)
 * - League Pro: 24h after membership sync (`requireWelcome: false`)
 */
export async function scheduleCommunityInviteEmail(
  admin: AdminClient,
  userId: string,
  options: { requireWelcome?: boolean } = {},
): Promise<ScheduleCommunityInviteResult> {
  const requireWelcome = options.requireWelcome ?? true;

  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "display_name, welcome_email_sent_at, community_invite_email_id, community_invite_email_scheduled_at, deactivated_at",
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

  if (profile.community_invite_email_id || profile.community_invite_email_scheduled_at) {
    return { status: "skipped", reason: "Community invite email already scheduled." };
  }

  if (requireWelcome && !profile.welcome_email_sent_at) {
    return { status: "skipped", reason: "Welcome email not sent yet." };
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

  const scheduledAt = resolveSendAt(requireWelcome ? profile.welcome_email_sent_at : null);
  if (!scheduledAt) {
    return { status: "skipped", reason: "Community invite schedule window has passed." };
  }

  const { id } = await scheduleResendEmail({
    to: email,
    subject: "Join the VectorDarts Community on Discord",
    html: renderCommunityInviteEmailHtml({
      firstName: getCommunityInviteFirstName(profile.display_name),
      discordInviteLink: getDiscordInviteUrl(),
      logoUrl: EMAIL_LOGO_CID_SRC,
      websiteUrl: "https://vectordarts.app",
    }),
    scheduledAt,
    attachments: [getEmailLogoAttachment()],
    tags: [
      { name: "category", value: "community-invite" },
      { name: "channel", value: "discord" },
    ],
  });

  const { data: updated, error: updateError } = await admin
    .from("profiles")
    .update({
      community_invite_email_id: id,
      community_invite_email_scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", userId)
    .is("community_invite_email_id", null)
    .is("community_invite_email_scheduled_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    await cancelResendEmail(id).catch(() => undefined);
    throw new Error(updateError.message);
  }

  if (!updated) {
    await cancelResendEmail(id).catch(() => undefined);
    return { status: "skipped", reason: "Community invite email already scheduled." };
  }

  return {
    status: "scheduled",
    emailId: id,
    scheduledAt: scheduledAt.toISOString(),
  };
}
