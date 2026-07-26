import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

function formatQueryError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) {
      return new Error(parts.join(" — "));
    }
  }

  return new Error(fallback);
}

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
  max_players: number | null;
  player_count: number;
  membership_status: string | null;
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
): Promise<{
  inviteId: string;
  token: string;
  expiresAt: string;
  notified: boolean;
  recipientUserId: string | null;
}> {
  const { data, error } = await supabase.rpc("create_league_invite", {
    p_league_player_id: leaguePlayerId,
  });

  if (error) {
    throw formatQueryError(error, "Unable to create invite.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Invite was not created.");
  }

  return {
    inviteId: row.invite_id,
    token: row.token,
    expiresAt: row.expires_at,
    notified: Boolean(row.notified),
    recipientUserId: row.recipient_user_id ?? null,
  };
}

export async function deliverPendingLeagueInvites(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { data, error } = await supabase.rpc("deliver_pending_league_invites");

  if (error) {
    throw formatQueryError(error, "Unable to deliver pending invites.");
  }

  return typeof data === "number" ? data : 0;
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

  // Fire-and-forget transactional approval email (idempotent on the server).
  if (typeof window !== "undefined") {
    void fetch("/api/emails/league-approved", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaguePlayerId }),
    }).catch(() => undefined);
  }
}
