import type { SupabaseClient } from "@supabase/supabase-js";
import { playerLeaguePath } from "@/lib/auth/routes";
import { renderLeagueApprovedEmailHtml } from "@/lib/email/league-approved-template";
import { EMAIL_LOGO_CID_SRC, getEmailLogoAttachment } from "@/lib/email/logo";
import { isResendConfigured, sendResendEmail } from "@/lib/email/resend";
import { getAppSiteUrl } from "@/lib/email/site-url";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export type SendLeagueApprovedResult =
  | { status: "sent"; emailId: string }
  | { status: "skipped"; reason: string }
  | { status: "unavailable"; reason: string };

function formatGameLabel(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  return value
    .trim()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function sendLeagueApprovedEmail(
  admin: AdminClient,
  leaguePlayerId: string,
): Promise<SendLeagueApprovedResult> {
  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const { data: player, error: playerError } = await admin
    .from("league_players")
    .select(
      "id, first_name, last_name, email, status, profile_user_id, approval_email_sent_at, league_id, leagues!inner(id, name, starts_at, ends_at, game_format, competition_format, organization_id, organizations!inner(name))",
    )
    .eq("id", leaguePlayerId)
    .maybeSingle();

  if (playerError) {
    throw new Error(playerError.message);
  }

  if (!player) {
    return { status: "skipped", reason: "League player not found." };
  }

  if (player.status !== "active") {
    return { status: "skipped", reason: "Player is not an active league member." };
  }

  if (player.approval_email_sent_at) {
    return { status: "skipped", reason: "Approval email already sent." };
  }

  const league = player.leagues as unknown as {
    id: string;
    name: string;
    starts_at: string | null;
    ends_at: string | null;
    game_format: string | null;
    competition_format: string | null;
    organization_id: string;
    organizations: { name: string };
  };

  let email = player.email?.trim().toLowerCase() || null;

  if (!email && player.profile_user_id) {
    const {
      data: { user },
      error: userError,
    } = await admin.auth.admin.getUserById(player.profile_user_id);

    if (userError) {
      throw new Error(userError.message);
    }

    email = user?.email?.trim().toLowerCase() || null;
  }

  if (!email) {
    return { status: "skipped", reason: "Player has no email address." };
  }

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("league_players")
    .update({ approval_email_sent_at: claimedAt })
    .eq("id", leaguePlayerId)
    .is("approval_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimed) {
    return { status: "skipped", reason: "Approval email already sent." };
  }

  const firstName = player.first_name?.trim() || "there";
  const siteUrl = getAppSiteUrl();
  const leagueUrl = `${siteUrl}${playerLeaguePath(league.id)}`;

  try {
    const { id } = await sendResendEmail({
      to: email,
      subject: `You're approved for ${league.name}`,
      html: renderLeagueApprovedEmailHtml({
        firstName,
        leagueName: league.name,
        organizationName: league.organizations?.name ?? null,
        startsAt: league.starts_at,
        endsAt: league.ends_at,
        gameFormat: formatGameLabel(league.game_format),
        competitionFormat: formatGameLabel(league.competition_format),
        leagueUrl,
        logoUrl: EMAIL_LOGO_CID_SRC,
      }),
      attachments: [getEmailLogoAttachment()],
      tags: [
        { name: "category", value: "league_approved" },
        { name: "league_id", value: league.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) },
      ],
    });

    return { status: "sent", emailId: id };
  } catch (error) {
    await admin
      .from("league_players")
      .update({ approval_email_sent_at: null })
      .eq("id", leaguePlayerId)
      .eq("approval_email_sent_at", claimedAt);

    throw error;
  }
}
