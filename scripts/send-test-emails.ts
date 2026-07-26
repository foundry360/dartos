import { renderLeagueApprovedEmailHtml } from "../lib/email/league-approved-template";
import {
  EMAIL_LOGO_CID_SRC,
  getEmailLogoAttachment,
} from "../lib/email/logo";
import { renderTrialEndingEmailHtml } from "../lib/email/trial-ending-template";
import { renderTrialOfferEmailHtml } from "../lib/email/trial-offer-template";
import { renderWelcomeEmailHtml } from "../lib/email/welcome-template";

const to = process.argv[2] || "jgelsomino@foundry360.us";
const only = process.argv[3]; // optional filter, e.g. trial-offer
const apiKey = process.env.RESEND_API_KEY?.trim();
const fromEmail = process.env.RESEND_SENDER_EMAIL?.trim() || "support@vectordarts.app";
const fromName = process.env.RESEND_SENDER_NAME?.trim() || "VectorOS";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://play.vectordarts.app").replace(
  /\/$/,
  "",
);

if (!apiKey) {
  console.error("RESEND_API_KEY is missing.");
  process.exit(1);
}

async function sendEmail(subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      attachments: [getEmailLogoAttachment()],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok || !payload.id) {
    throw new Error(payload.message || `Resend error (${response.status})`);
  }

  return payload.id;
}

const logoUrl = EMAIL_LOGO_CID_SRC;

const emails = [
  {
    name: "trial-offer",
    subject: "[TEST] Your free VectorOS trial starts now",
    html: renderTrialOfferEmailHtml({
      firstName: "Jason",
      trialActivationLink: `${siteUrl}/subscribe`,
      unsubscribeLink: `${siteUrl}/api/emails/unsubscribe?token=test`,
      logoUrl,
    }),
  },
  {
    name: "welcome-club",
    subject: "[TEST] Welcome to VectorOS! (Club)",
    html: renderWelcomeEmailHtml({
      firstName: "Jason",
      planId: "club",
      openAppLink: `${siteUrl}/home`,
      logoUrl,
    }),
  },
  {
    name: "welcome-elite",
    subject: "[TEST] Welcome to VectorOS! (Elite)",
    html: renderWelcomeEmailHtml({
      firstName: "Jason",
      planId: "elite",
      openAppLink: `${siteUrl}/home`,
      logoUrl,
    }),
  },
  {
    name: "trial-ending",
    subject: "[TEST] Your VectorOS trial ends in 3 days",
    html: renderTrialEndingEmailHtml({
      firstName: "Jason",
      planId: "elite",
      openAppLink: `${siteUrl}/home`,
      logoUrl,
    }),
  },
  {
    name: "league-approved",
    subject: "[TEST] You're approved for Thursday Night 501",
    html: renderLeagueApprovedEmailHtml({
      firstName: "Jason",
      leagueName: "Thursday Night 501",
      organizationName: "Dart House",
      startsAt: "2026-08-01T00:00:00.000Z",
      endsAt: "2026-10-30T00:00:00.000Z",
      gameFormat: "501",
      competitionFormat: "Singles",
      leagueUrl: `${siteUrl}/player/leagues/example`,
      logoUrl,
    }),
  },
] as const;

async function main() {
  const selected = only
    ? emails.filter((email) => email.name === only)
    : emails;

  if (selected.length === 0) {
    console.error(`No emails matched "${only}"`);
    process.exit(1);
  }

  for (const email of selected) {
    try {
      const id = await sendEmail(email.subject, email.html);
      console.log(`sent ${email.name}: ${id}`);
    } catch (error) {
      console.error(
        `failed ${email.name}:`,
        error instanceof Error ? error.message : error,
      );
      process.exitCode = 1;
    }
  }

  console.log(`Done. Sent to ${to}`);
}

void main();
