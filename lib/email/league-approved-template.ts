function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLeagueDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function detailRow(
  label: string,
  value: string | null | undefined,
  options?: { paddingTop?: number; paddingBottom?: number },
): string {
  if (!value?.trim()) {
    return "";
  }

  const paddingTop = options?.paddingTop ?? 8;
  const paddingBottom = options?.paddingBottom ?? 8;
  const cellPadding = `padding:${paddingTop}px 0 ${paddingBottom}px;`;

  return `<tr>
    <td style="${cellPadding} font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#6B7280; width:140px; vertical-align:top;">${escapeHtml(label)}</td>
    <td style="${cellPadding} font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#111827; vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

export function renderLeagueApprovedEmailHtml(input: {
  firstName: string;
  leagueName: string;
  organizationName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  gameFormat: string | null;
  competitionFormat: string | null;
  leagueUrl: string;
  logoUrl: string;
}): string {
  const firstName = escapeHtml(input.firstName);
  const leagueName = escapeHtml(input.leagueName);
  const leagueUrl = escapeHtml(input.leagueUrl);
  const logoUrl = escapeHtml(input.logoUrl);
  const startLabel = formatLeagueDate(input.startsAt);
  const endLabel = formatLeagueDate(input.endsAt);
  const seasonLabel =
    startLabel && endLabel
      ? `${startLabel} - ${endLabel}`
      : startLabel
        ? `Starts ${startLabel}`
        : endLabel
          ? `Ends ${endLabel}`
          : null;

  const detailEntries = [
    { label: "League", value: input.leagueName },
    { label: "Venue", value: input.organizationName },
    { label: "Season", value: seasonLabel },
    { label: "Format", value: input.competitionFormat },
    { label: "Game", value: input.gameFormat },
  ].filter((entry) => Boolean(entry.value?.trim()));

  const details = detailEntries
    .map((entry, index) =>
      detailRow(entry.label, entry.value, {
        paddingTop: index === 0 ? 20 : 8,
        paddingBottom: index === detailEntries.length - 1 ? 20 : 8,
      }),
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're approved for ${leagueName}</title>
</head>
<body style="margin:0; padding:0; background-color:#F3F4F6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px; max-width:560px; background-color:#FFFFFF; border:1px solid #E5E7EB; border-radius:8px; overflow:hidden;">
        <tr>
          <td align="center" style="padding:24px 32px; background-color:#0B0F0D;">
            <img
              src="${logoUrl}"
              alt="VectorOS"
              width="280"
              height="31"
              style="display:block; margin:0 auto; width:280px; max-width:100%; height:auto; border:0;"
            />
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0; font-family:Helvetica,Arial,sans-serif; font-size:22px; line-height:1.3; font-weight:700; color:#111827;">
            You're approved for ${leagueName}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#374151;">
            Hi ${firstName},
          </td>
        </tr>
        <tr>
          <td style="padding:12px 32px 0; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#374151;">
            Your league registration has been approved by the league director. You can open the league in VectorOS to view the schedule, standings, and roster.
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E7EB; border-bottom:1px solid #E5E7EB;">
              ${details}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <a href="${leagueUrl}" style="display:inline-block; background-color:#6f9e24; color:#FFFFFF; text-decoration:none; font-family:Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; padding:12px 22px; border-radius:6px;">
              View league details
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 32px; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:#9CA3AF;">
            If the button doesn't work, open this link:<br>
            <a href="${leagueUrl}" style="color:#6B7280; word-break:break-all;">${leagueUrl}</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#9CA3AF;">
        You're receiving this because a league director approved your registration.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}
