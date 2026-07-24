import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type JoinableLeague = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organization_id: string;
  organization_name: string;
  registration_mode: string;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
  game_format: string | null;
  format: string | null;
};

export async function searchJoinableLeagues(
  supabase: SupabaseClient<Database>,
  query: string,
  limit = 20,
): Promise<JoinableLeague[]> {
  const { data, error } = await supabase.rpc("search_joinable_leagues", {
    search_query: query,
    result_limit: limit,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as JoinableLeague[];
}

export async function joinLeagueByCode(
  supabase: SupabaseClient<Database>,
  code: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("join_league_by_code", {
    p_code: code,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function acceptLeagueInvite(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("accept_league_invite", {
    p_token: token,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function requestLeagueRegistration(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("request_league_registration", {
    p_league_id: leagueId,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function createLeagueInvite(
  supabase: SupabaseClient<Database>,
  leaguePlayerId: string,
): Promise<{ inviteId: string; token: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc("create_league_invite", {
    p_league_player_id: leaguePlayerId,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Invite was not created.");
  }

  return {
    inviteId: row.invite_id,
    token: row.token,
    expiresAt: row.expires_at,
  };
}

export async function rotateLeagueJoinCode(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("rotate_league_join_code", {
    p_league_id: leagueId,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function updateLeagueRegistrationSettings(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  registrationMode: "invite_only" | "code" | "open",
  ensureJoinCode = false,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("update_league_registration_settings", {
    p_league_id: leagueId,
    p_registration_mode: registrationMode,
    p_ensure_join_code: ensureJoinCode,
  });

  if (error) {
    throw error;
  }

  return (data as string | null) ?? null;
}

export async function approveLeagueRegistration(
  supabase: SupabaseClient<Database>,
  leaguePlayerId: string,
): Promise<void> {
  const { error } = await supabase.rpc("approve_league_registration", {
    p_league_player_id: leaguePlayerId,
  });

  if (error) {
    throw error;
  }
}
