import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import { getTrialOfferFirstName } from "@/lib/email/trial-offer-template";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";

export { getTrialOfferFirstName as getTrialEndingFirstName };

export const TRIAL_ENDING_REMINDER_DAYS_LEFT = 3;
export const TRIAL_ENDING_REMINDER_DELAY_DAYS = 4;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderTrialEndingEmailHtml(input: {
  firstName: string;
  planId: Extract<SubscriptionPlanId, "club" | "elite">;
  openAppLink: string;
  logoUrl: string;
}): string {
  const firstName = escapeHtml(input.firstName);
  const openAppLink = escapeHtml(input.openAppLink);
  const logoUrl = escapeHtml(input.logoUrl);
  const planName = escapeHtml(getSubscriptionPlan(input.planId).name);
  const daysLeft = TRIAL_ENDING_REMINDER_DAYS_LEFT;
  const trialDays = SUBSCRIPTION_TRIAL_DAYS;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your VectorOS trial ends in ${daysLeft} days</title>
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
  Your VectorOS ${planName} trial ends in ${daysLeft} days.
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
              ${daysLeft} days left
            </div>
            <h1 style="margin:0 0 16px; font-family:'Barlow Condensed',Arial,sans-serif; font-size:34px; line-height:1.15; color:#F3EEE3; font-weight:600;">
              Your free trial<br>ends in ${daysLeft} days
            </h1>
            <p style="margin:0 0 8px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#B7B2A6;">
              Hi ${firstName}, your ${trialDays}-day VectorOS ${planName} trial is almost over. Keep practicing, scoring matches, and tracking your progress. Your membership continues automatically when the trial ends.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:24px 40px 8px;">
            <a href="${openAppLink}" style="display:inline-block; background-color:#6f9e24; color:#0E1210; text-decoration:none; font-family:'Barlow Condensed',Arial,sans-serif; font-size:16px; letter-spacing:1px; text-transform:uppercase; font-weight:600; padding:14px 36px; border-radius:4px;">
              Open VectorOS
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 40px 0; text-align:center; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#6E6A5F;">
            Cancel anytime before your trial ends and you won't be charged.
          </td>
        </tr>

        <tr>
          <td class="px" style="padding:32px 40px 40px; font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.7; color:#C9C4B8; text-align:center;">
            Make the most of your remaining ${daysLeft} days. Jump into a practice session, play a match, or check your stats and see how far you've come.
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
            You're receiving this because you started a VectorOS ${planName} free trial.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
