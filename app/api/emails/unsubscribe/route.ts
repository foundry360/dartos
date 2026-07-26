import { NextResponse } from "next/server";
import { optOutPlayerTrialOfferEmail } from "@/lib/email/schedule-trial-offer";
import { verifyTrialOfferUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0; padding:48px 20px; background:#0E1210; color:#F3EEE3; font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px; margin:0 auto; text-align:center; line-height:1.6;">
    <h1 style="font-size:22px; margin:0 0 12px;">${title}</h1>
    <p style="margin:0; color:#B7B2A6;">${body}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse(htmlPage("Unsubscribe", "This unsubscribe link is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let userId: string | null;
  try {
    userId = verifyTrialOfferUnsubscribeToken(token);
  } catch {
    return new NextResponse(
      htmlPage("Unsubscribe", "Unsubscribe is not configured on this server."),
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }

  if (!userId) {
    return new NextResponse(htmlPage("Unsubscribe", "This unsubscribe link is invalid or expired."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const admin = createAdminClient();
  if (!admin) {
    return new NextResponse(htmlPage("Unsubscribe", "Unable to update your email preferences."), {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    await optOutPlayerTrialOfferEmail(admin, userId);
  } catch {
    return new NextResponse(htmlPage("Unsubscribe", "Unable to update your email preferences."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    htmlPage(
      "You're unsubscribed",
      "You won't receive the VectorOS free trial offer email. You can still use your account anytime.",
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
