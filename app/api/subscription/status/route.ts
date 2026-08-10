import { NextResponse } from "next/server";
import {
  getUserActiveSubscriptionSnapshot,
  userCanAccessLeagueManagement,
  userCanAccessLeaguePlay,
  userHasActiveSubscription,
} from "@/lib/subscription/access";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const empty = {
    active: false,
    plan: null,
    status: null as string | null,
    trialing: false,
    elite: false,
    leaguePlay: false,
    leagueManagement: false,
  };

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(empty);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(empty);
  }

  const [active, snapshot, leaguePlay, leagueManagement] = await Promise.all([
    userHasActiveSubscription(supabase, user.id),
    getUserActiveSubscriptionSnapshot(supabase, user.id),
    userCanAccessLeaguePlay(supabase, user.id),
    userCanAccessLeagueManagement(supabase, user.id),
  ]);

  const plan = snapshot?.planId ?? null;
  const status = snapshot?.status ?? null;

  return NextResponse.json({
    active,
    plan,
    status,
    trialing: status === "trialing",
    elite: plan === "elite" || plan === "league_pro",
    leaguePlay,
    leagueManagement,
  });
}
