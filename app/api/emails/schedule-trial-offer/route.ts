import { NextResponse } from "next/server";
import { schedulePlayerTrialOfferEmail } from "@/lib/email/schedule-trial-offer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const admin = createAdminClient();

  if (!supabase || !admin) {
    return NextResponse.json({ error: "Email services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const result = await schedulePlayerTrialOfferEmail(admin, user.id, user.email);

    if (result.status === "unavailable") {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to schedule trial offer email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
