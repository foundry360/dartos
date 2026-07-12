import { NextResponse } from "next/server";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";
import { userIsTrialEligible } from "@/lib/subscription/trial-eligibility";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ eligible: false, trialDays: SUBSCRIPTION_TRIAL_DAYS });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ eligible: false, trialDays: SUBSCRIPTION_TRIAL_DAYS });
  }

  const eligible = await userIsTrialEligible(supabase, user.id);

  return NextResponse.json({ eligible, trialDays: SUBSCRIPTION_TRIAL_DAYS });
}
