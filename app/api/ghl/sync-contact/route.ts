import { NextResponse } from "next/server";
import { syncUserContactToGhl } from "@/lib/ghl/upsert-contact";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Upsert the signed-in user's name, email, and subscription into GoHighLevel. */
export async function POST() {
  const supabase = await createClient();
  const admin = createAdminClient();

  if (!supabase || !admin) {
    return NextResponse.json({ error: "GoHighLevel sync is unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const result = await syncUserContactToGhl(admin, user.id);

    if (result.status === "unavailable") {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync contact to GoHighLevel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
