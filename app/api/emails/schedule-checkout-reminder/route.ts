import { NextResponse } from "next/server";
import { scheduleMemberCheckoutReminderEmail } from "@/lib/email/schedule-checkout-reminder";
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
    const result = await scheduleMemberCheckoutReminderEmail(admin, user.id, user.email);

    if (result.status === "unavailable") {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to schedule checkout reminder email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
