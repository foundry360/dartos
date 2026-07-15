import { NextResponse } from "next/server";
import {
  getUserActiveSubscriptionPlan,
  userCanAccessLeagueManagement,
  userCanAccessLeaguePlay,
  userHasActiveSubscription,
} from "@/lib/subscription/access";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({
      active: false,
      plan: null,
      elite: false,
      leaguePlay: false,
      leagueManagement: false,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      active: false,
      plan: null,
      elite: false,
      leaguePlay: false,
      leagueManagement: false,
    });
  }

  const [active, plan, leaguePlay, leagueManagement] = await Promise.all([
    userHasActiveSubscription(supabase, user.id),
    getUserActiveSubscriptionPlan(supabase, user.id),
    userCanAccessLeaguePlay(supabase, user.id),
    userCanAccessLeagueManagement(supabase, user.id),
  ]);

  return NextResponse.json({
    active,
    plan,
    elite: plan === "elite" || plan === "league_pro",
    leaguePlay,
    leagueManagement,
  });
}
