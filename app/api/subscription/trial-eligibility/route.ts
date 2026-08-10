import { NextResponse } from "next/server";
import { isSubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import {
  CLUB_ELITE_TRIAL_DAYS,
  getTrialDaysForPlan,
  planAllowsNoCardTrial,
} from "@/lib/subscription/trial";
import { userIsTrialEligible } from "@/lib/subscription/trial-eligibility";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const planParam = searchParams.get("plan");
  const planId = isSubscriptionPlanId(planParam) ? planParam : null;
  const trialDays = planId ? getTrialDaysForPlan(planId) : CLUB_ELITE_TRIAL_DAYS;
  const requiresCard = planId ? !planAllowsNoCardTrial(planId) : false;

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({
      eligible: false,
      trialDays,
      requiresCard,
      noCardTrial: false,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      eligible: false,
      trialDays,
      requiresCard,
      noCardTrial: false,
    });
  }

  const eligible = await userIsTrialEligible(supabase, user.id);
  const noCardTrial = Boolean(eligible && planId && planAllowsNoCardTrial(planId));

  return NextResponse.json({
    eligible,
    trialDays,
    requiresCard: planId ? !planAllowsNoCardTrial(planId) || !eligible : false,
    noCardTrial,
  });
}
