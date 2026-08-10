import { getTrialOfferFirstName } from "@/lib/email/trial-offer-template";
import { CLUB_ELITE_TRIAL_DAYS } from "@/lib/subscription/trial";

export { getTrialOfferFirstName as getCheckoutReminderFirstName };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCheckoutReminderEmailHtml(input: {
  firstName: string;
  checkoutLink: string;
  unsubscribeLink: string;
  logoUrl: string;
}): string {
  const firstName = escapeHtml(input.firstName);
  const checkoutLink = escapeHtml(input.checkoutLink);
  const unsubscribeLink = escapeHtml(input.unsubscribeLink);
  const logoUrl = escapeHtml(input.logoUrl);
  const days = CLUB_ELITE_TRIAL_DAYS;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Finish setting up VectorOS</title>
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
  You created a VectorOS account. Finish setup and start your free ${days}-day trial.
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
              One step left
            </div>
            <h1 style="margin:0 0 16px; font-family:'Barlow Condensed',Arial,sans-serif; font-size:34px; line-height:1.15; color:#F3EEE3; font-weight:600;">
              Your VectorOS membership<br>is waiting
            </h1>
            <p style="margin:0 0 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              Hi ${firstName}, you created your VectorOS account but haven't started your trial yet. Choose Club or Elite and start a free ${days}-day trial — no card required. Cancel anytime before day ${days} and you won't be charged.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:24px 40px 8px;">
            <a href="${checkoutLink}" style="display:inline-block; background-color:#6f9e24; color:#0E1210; text-decoration:none; font-family:'Barlow Condensed',Arial,sans-serif; font-size:16px; letter-spacing:1px; text-transform:uppercase; font-weight:600; padding:14px 36px; border-radius:4px;">
              Start Free Trial
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 40px 0; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#6E6A5F;">
            Takes about a minute. No card required for Club or Elite.
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:32px 40px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:#C9C4B8; text-align:center;">
            Practice with purpose, score every match, track detailed stats, and see your progress over time. Whether you're chasing higher averages, improving your checkout percentage, or simply playing more often, VectorOS gives you the tools to become a better player.
          </td>
        </tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <div style="height:1px; background-color:#24302B; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:24px 40px 40px;">
            <div style="font-family:'IBM Plex Mono',Consolas,monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#6E6A5F; text-align:center; margin-bottom:20px;">
              Everything unlocked for ${days} days
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="50%" style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Bot play</td>
                <td width="50%" style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Head-to-head matches</td>
              </tr>
              <tr>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Local league registration</td>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Personal player profile</td>
              </tr>
              <tr>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Custom board themes</td>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Match scoring and history</td>
              </tr>
              <tr>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Practice modes and training tools</td>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Performance tracking</td>
              </tr>
              <tr>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Game statistics and insights</td>
                <td style="padding:10px 8px; font-family:Helvetica,Arial,sans-serif; font-size:14px; color:#E4DFD2; vertical-align:top;"><span style="color:#6f9e24; font-weight:700; margin-right:8px;">✓</span>Milestones and achievements</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px; background-color:#24302B; line-height:1px; font-size:1px;">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:28px 40px 40px; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#6E6A5F; line-height:1.6;">
            Questions? Reply to this email or visit <a href="https://vectordarts.app" style="color:#B7B2A6; text-decoration:underline;">vectordarts.app</a>.<br>
            You're receiving this because you created a VectorOS account and haven't started your free trial.<br>
            <a href="${unsubscribeLink}" style="color:#B7B2A6; text-decoration:underline;">Unsubscribe</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
