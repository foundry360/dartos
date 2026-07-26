import { NextResponse } from "next/server";
import { sendLeagueApprovedEmail } from "@/lib/email/send-league-approved";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface LeagueApprovedRequestBody {
  leaguePlayerId?: string;
}

export async function POST(request: Request) {
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

  let body: LeagueApprovedRequestBody;
  try {
    body = (await request.json()) as LeagueApprovedRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const leaguePlayerId = body.leaguePlayerId?.trim();
  if (!leaguePlayerId) {
    return NextResponse.json({ error: "leaguePlayerId is required." }, { status: 400 });
  }

  const { data: player, error: playerError } = await admin
    .from("league_players")
    .select("id, league_id, leagues!inner(organization_id)")
    .eq("id", leaguePlayerId)
    .maybeSingle();

  if (playerError) {
    return NextResponse.json({ error: playerError.message }, { status: 500 });
  }

  if (!player) {
    return NextResponse.json({ error: "League player not found." }, { status: 404 });
  }

  const organizationId = (
    player.leagues as unknown as { organization_id: string }
  ).organization_id;

  const { data: allowed, error: roleError } = await supabase.rpc("has_organization_role", {
    org_id: organizationId,
    allowed_roles: ["owner", "admin"],
  });

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed to notify players for this league." }, { status: 403 });
  }

  try {
    const result = await sendLeagueApprovedEmail(admin, leaguePlayerId);

    if (result.status === "unavailable") {
      return NextResponse.json({ error: result.reason }, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send league approval email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
