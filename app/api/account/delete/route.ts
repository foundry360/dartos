import { NextResponse } from "next/server";
import { deactivateUserAccountWithBilling } from "@/lib/account/deactivate-user-account";
import { isStripeConfigured } from "@/lib/stripe/env";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const REMOVE_CONFIRMATION_TEXT = "Remove";

interface DeleteAccountBody {
  confirmation?: string | null;
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!admin || !supabase) {
    return NextResponse.json({ error: "Account services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: DeleteAccountBody;

  try {
    body = (await request.json()) as DeleteAccountBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.confirmation !== REMOVE_CONFIRMATION_TEXT) {
    return NextResponse.json(
      { error: `Type "${REMOVE_CONFIRMATION_TEXT}" to confirm.` },
      { status: 400 },
    );
  }

  try {
    const stripe = isStripeConfigured() ? getStripeClient() : null;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await deactivateUserAccountWithBilling(admin, user.id, {
      stripe,
      accessToken: session?.access_token ?? null,
    });

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
