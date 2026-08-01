import { getTrialOfferFirstName } from "@/lib/email/trial-offer-template";

export { getTrialOfferFirstName as getCommunityInviteFirstName };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const COMMUNITY_FEATURES = [
  "Connect with players, leagues, and tournament organizers.",
  "Ask questions and get help from the VectorDarts team and community.",
  "Get an early look at upcoming features and product updates.",
  "Participate in discussions with League Directors and community leaders.",
  "Vote on new features and help shape the future of VectorOS.",
  "Receive invitations to beta programs and exclusive community events.",
] as const;

function renderFeatureList(features: readonly string[]): string {
  return features
    .map(
      (feature) => `
        <tr>
          <td style="padding:8px 0; font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.55; color:#E4DFD2; vertical-align:top;">
            <span style="color:#6f9e24; font-weight:700; margin-right:10px;">✓</span>${escapeHtml(feature)}
          </td>
        </tr>`,
    )
    .join("");
}

export function renderCommunityInviteEmailHtml(input: {
  firstName: string;
  discordInviteLink: string;
  logoUrl: string;
  websiteUrl?: string;
}): string {
  const firstName = escapeHtml(input.firstName);
  const discordInviteLink = escapeHtml(input.discordInviteLink);
  const logoUrl = escapeHtml(input.logoUrl);
  const websiteUrl = escapeHtml(input.websiteUrl?.trim() || "https://vectordarts.app");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Join the Community</title>
<style>
  body,table,td{-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0; display:block;}
  @media (max-width:480px){
    .container{width:100% !important;}
    .px{padding-left:22px !important; padding-right:22px !important;}
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0E1210;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">
  Join the official VectorDarts Discord community.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0E1210;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#141916;">

        <tr>
          <td class="px" align="center" style="padding:40px 40px 24px; border-bottom:1px solid #24302B;">
            <img
              src="${logoUrl}"
              alt="VectorOS"
              width="240"
              height="27"
              style="display:block; margin:0 auto; width:240px; max-width:100%; height:auto; border:0;"
            />
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:40px 40px 8px; text-align:center;">
            <div style="font-family:'IBM Plex Mono',Consolas,monospace; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:#6f9e24; margin-bottom:14px;">
              Community
            </div>
            <h1 style="margin:0 0 16px; font-family:'Barlow Condensed',Arial,sans-serif; font-size:34px; line-height:1.15; color:#F3EEE3; font-weight:600;">
              Join the Community
            </h1>
            <p style="margin:0 0 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              Hi ${firstName},
            </p>
            <p style="margin:0 0 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              Thanks for joining <strong style="color:#E4DFD2;">VectorOS</strong>! We're excited to have you as part of the community.
            </p>
            <p style="margin:16px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              VectorOS is more than a scoring app. It's a growing community of players, league directors, tournament organizers, and fans who are helping shape the future of darts.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 40px 0;">
            <div style="height:1px; background-color:#24302B; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:28px 40px 8px; text-align:center;">
            <h2 style="margin:0 0 12px; font-family:'Barlow Condensed',Arial,sans-serif; font-size:24px; line-height:1.2; color:#F3EEE3; font-weight:600;">
              Join the Official VectorDarts Discord
            </h2>
            <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              Connect with players from around the world, ask questions, share feedback, and get early access to new features.
            </p>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:20px 40px 8px;">
            <div style="font-family:'IBM Plex Mono',Consolas,monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#6E6A5F; text-align:center; margin-bottom:12px;">
              Inside the community you'll be able to
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${renderFeatureList(COMMUNITY_FEATURES)}
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:28px 40px 8px;">
            <a href="${discordInviteLink}" style="display:inline-block; background-color:#6f9e24; color:#0E1210; text-decoration:none; font-family:'Barlow Condensed',Arial,sans-serif; font-size:16px; letter-spacing:1px; text-transform:uppercase; font-weight:600; padding:14px 36px; border-radius:4px;">
              Join the Community
            </a>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:16px 40px 8px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#6E6A5F;">
            Or open this link:<br>
            <a href="${discordInviteLink}" style="color:#B7B2A6; text-decoration:underline; word-break:break-all;">${discordInviteLink}</a>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:24px 40px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:#C9C4B8; text-align:center;">
            We're building VectorOS alongside our community, and your ideas and feedback help make the platform better with every release.
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:20px 40px 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.7; color:#B7B2A6; text-align:center;">
            Thanks again for joining us. We look forward to seeing you in the community.
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:8px 40px 32px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:#E4DFD2;">
            <strong>The VectorDarts Team</strong><br>
            <span style="color:#6f9e24; font-family:'Barlow Condensed',Arial,sans-serif; font-size:16px; letter-spacing:1px; text-transform:uppercase;">Play. Practice. Compete.</span><br>
            <a href="${websiteUrl}" style="color:#B7B2A6; text-decoration:underline;">vectordarts.app</a>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px; background-color:#24302B; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:28px 40px 40px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#6E6A5F; line-height:1.6;">
            You're receiving this because you joined VectorOS.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
