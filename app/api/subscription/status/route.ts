import { NextResponse } from "next/server";
import { userHasActiveSubscription } from "@/lib/subscription/access";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ active: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ active: false });
  }

  const active = await userHasActiveSubscription(supabase, user.id);

  return NextResponse.json({ active });
}
