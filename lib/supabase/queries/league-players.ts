import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateLeaguePlayerInput,
  LeaguePlayer,
  LeaguePlayerDirectoryHit,
  LeaguePlayerStatus,
  VectorAccountState,
} from "@/features/leagues/lib/league-players";
import type { Database, LeaguePlayerRow } from "@/lib/supabase/database.types";
import { notifyLeaguePlayerRegisteredSafe } from "@/lib/supabase/queries/league-notifications";
import { fetchSavedPlayers } from "@/lib/supabase/queries/players";
import type { SavedPlayerProfile } from "@/types/player-setup";

const LEAGUE_PLAYER_SELECT = `
  id,
  league_id,
  first_name,
  last_name,
  nickname,
  email,
  phone,
  color,
  avatar_url,
  team_id,
  team_name,
  status,
  vector_account,
  saved_player_id,
  profile_user_id,
  created_by,
  created_at,
  updated_at,
  league_teams (
    id,
    name,
    color
  )
` as const;

const PLAYER_STATUSES = new Set<LeaguePlayerStatus>([
  "active",
  "invited",
  "pending",
  "inactive",
]);

const VECTOR_STATES = new Set<VectorAccountState>([
  "connected",
  "profile-only",
  "invitation-pending",
  "no-account",
]);

function asStatus(value: string): LeaguePlayerStatus {
  return PLAYER_STATUSES.has(value as LeaguePlayerStatus)
    ? (value as LeaguePlayerStatus)
    : "active";
}

function asVectorAccount(value: string): VectorAccountState {
  return VECTOR_STATES.has(value as VectorAccountState)
    ? (value as VectorAccountState)
    : "profile-only";
}

type LeaguePlayerQueryRow = LeaguePlayerRow & {
  league_teams?: { id: string; name: string; color: string } | null;
};

export function mapLeaguePlayerRow(row: LeaguePlayerQueryRow): LeaguePlayer {
  const joinedTeam = row.league_teams;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    color: row.color,
    teamId: joinedTeam?.id ?? row.team_id,
    teamName: joinedTeam?.name ?? row.team_name,
    leagueStatus: asStatus(row.status),
    vectorAccount: asVectorAccount(row.vector_account),
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    average: null,
    checkoutPercent: null,
    highestCheckout: null,
    count180s: null,
    recentMatches: [],
    savedPlayerId: row.saved_player_id,
    profileUserId: row.profile_user_id,
  };
}

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "Player", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0] ?? "Player", lastName: "" };
  }

  return {
    firstName: parts[0] ?? "Player",
    lastName: parts.slice(1).join(" "),
  };
}

export function mapSavedPlayerToDirectoryHit(
  player: SavedPlayerProfile,
): LeaguePlayerDirectoryHit {
  const { firstName, lastName } = splitDisplayName(player.name);

  return {
    id: player.id,
    firstName,
    lastName,
    nickname: player.nickname ?? null,
    avatarUrl: player.avatarUrl ?? null,
    color: player.color ?? "#84C126",
    kind: "player-profile",
  };
}

export function mapVectorProfileToDirectoryHit(profile: {
  id: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}): LeaguePlayerDirectoryHit {
  const { firstName, lastName } = splitDisplayName(
    profile.display_name?.trim() || "Vector Player",
  );

  return {
    id: profile.id,
    firstName,
    lastName,
    nickname: profile.nickname,
    avatarUrl: profile.avatar_url,
    color: "#84C126",
    kind: "vector-user",
  };
}

function isPlayerAlreadyOnRoster(
  hit: LeaguePlayerDirectoryHit,
  existingPlayers: LeaguePlayer[],
) {
  const name = `${hit.firstName} ${hit.lastName}`.trim().toLowerCase();

  return existingPlayers.some((player) => {
    if (hit.kind === "vector-user" && player.profileUserId === hit.id) {
      return true;
    }

    if (hit.kind === "player-profile" && player.savedPlayerId === hit.id) {
      return true;
    }

    return leaguePlayerDisplayName(player).toLowerCase() === name;
  });
}

function leaguePlayerDisplayName(player: {
  firstName: string;
  lastName: string;
}) {
  return `${player.firstName} ${player.lastName}`.trim();
}

export async function fetchLeaguePlayers(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeaguePlayer[]> {
  const { data, error } = await supabase
    .from("league_players")
    .select(LEAGUE_PLAYER_SELECT)
    .eq("league_id", leagueId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapLeaguePlayerRow(row as LeaguePlayerQueryRow),
  );
}

const LEAGUE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LeagueRosterStats {
  playerCount: number;
  teamCount: number;
}

/** Player + assigned-team counts for the given leagues. */
export async function fetchRosterStatsForLeagues(
  supabase: SupabaseClient<Database>,
  leagueIds: string[],
): Promise<LeagueRosterStats> {
  const ids = [...new Set(leagueIds.map((id) => id.trim()).filter(Boolean))].filter(
    (id) => LEAGUE_ID_UUID_RE.test(id),
  );

  if (ids.length === 0) {
    return { playerCount: 0, teamCount: 0 };
  }

  const [
    { count: playerCount, error: playersError },
    { count: teamCount, error: teamsError },
  ] = await Promise.all([
    supabase
      .from("league_players")
      .select("id", { count: "exact", head: true })
      .in("league_id", ids),
    supabase
      .from("league_teams")
      .select("id", { count: "exact", head: true })
      .in("league_id", ids),
  ]);

  if (playersError) {
    throw playersError;
  }

  if (teamsError) {
    throw teamsError;
  }

  return {
    playerCount: playerCount ?? 0,
    teamCount: teamCount ?? 0,
  };
}

export async function fetchLeaguePlayerDirectory(
  supabase: SupabaseClient<Database>,
  existingPlayers: LeaguePlayer[],
): Promise<LeaguePlayerDirectoryHit[]> {
  const saved = await fetchSavedPlayers(supabase);

  return saved
    .map(mapSavedPlayerToDirectoryHit)
    .filter((hit) => !isPlayerAlreadyOnRoster(hit, existingPlayers));
}

export async function searchVectorProfiles(
  supabase: SupabaseClient<Database>,
  query: string,
  limit = 20,
): Promise<LeaguePlayerDirectoryHit[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc("search_vector_profiles", {
    search_query: trimmed,
    result_limit: limit,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapVectorProfileToDirectoryHit);
}

/** Saved profiles (always) + Vector users matching the query (2+ chars). */
export async function searchLeaguePlayerDirectory(
  supabase: SupabaseClient<Database>,
  query: string,
  existingPlayers: LeaguePlayer[],
  savedDirectory: LeaguePlayerDirectoryHit[],
): Promise<LeaguePlayerDirectoryHit[]> {
  const normalized = query.trim().toLowerCase();
  const savedHits = savedDirectory.filter((hit) => {
    if (isPlayerAlreadyOnRoster(hit, existingPlayers)) {
      return false;
    }

    if (!normalized) {
      return true;
    }

    return (
      `${hit.firstName} ${hit.lastName}`.toLowerCase().includes(normalized) ||
      (hit.nickname?.toLowerCase().includes(normalized) ?? false)
    );
  });

  if (normalized.length < 2) {
    return savedHits;
  }

  const vectorHits = (await searchVectorProfiles(supabase, query)).filter(
    (hit) => !isPlayerAlreadyOnRoster(hit, existingPlayers),
  );

  const seen = new Set(savedHits.map((hit) => `profile:${hit.id}`));
  const merged = [...savedHits];

  for (const hit of vectorHits) {
    const key = `vector:${hit.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(hit);
  }

  return merged;
}

export interface CreateLeaguePlayerRecordInput extends CreateLeaguePlayerInput {
  leagueId: string;
  createdBy: string;
  color?: string;
  teamId?: string | null;
  teamName?: string | null;
  savedPlayerId?: string | null;
  profileUserId?: string | null;
  vectorAccount?: VectorAccountState;
  status?: LeaguePlayerStatus;
  avatarUrl?: string | null;
}

export async function createLeaguePlayerRecord(
  supabase: SupabaseClient<Database>,
  input: CreateLeaguePlayerRecordInput,
): Promise<LeaguePlayer> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email?.trim() || null;
  const status =
    input.status ?? (email ? "invited" : "active");
  const vectorAccount =
    input.vectorAccount ??
    (input.profileUserId
      ? "connected"
      : email
        ? "invitation-pending"
        : "profile-only");

  const { data, error } = await supabase
    .from("league_players")
    .insert({
      league_id: input.leagueId,
      first_name: firstName,
      last_name: lastName,
      nickname: input.nickname?.trim() || null,
      email,
      phone: input.phone?.trim() || null,
      color: input.color ?? "#68707C",
      avatar_url: input.avatarUrl ?? null,
      team_id: input.teamId ?? null,
      team_name: input.teamName ?? null,
      status,
      vector_account: vectorAccount,
      saved_player_id: input.savedPlayerId ?? null,
      profile_user_id: input.profileUserId ?? null,
      created_by: input.createdBy,
    })
    .select(LEAGUE_PLAYER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const player = mapLeaguePlayerRow(data);

  if (player.profileUserId) {
    await notifyLeaguePlayerRegisteredSafe(supabase, {
      leagueId: input.leagueId,
      profileUserId: player.profileUserId,
    });
  }

  return player;
}

export async function addLeaguePlayerFromDirectoryHit(
  supabase: SupabaseClient<Database>,
  input: {
    leagueId: string;
    createdBy: string;
    hit: LeaguePlayerDirectoryHit;
  },
): Promise<LeaguePlayer> {
  return createLeaguePlayerRecord(supabase, {
    leagueId: input.leagueId,
    createdBy: input.createdBy,
    firstName: input.hit.firstName,
    lastName: input.hit.lastName,
    nickname: input.hit.nickname ?? undefined,
    email: input.hit.email ?? undefined,
    color: input.hit.color,
    avatarUrl: input.hit.avatarUrl,
    status: "active",
    vectorAccount:
      input.hit.kind === "vector-user" ? "connected" : "profile-only",
    savedPlayerId:
      input.hit.kind === "player-profile" ? input.hit.id : null,
    profileUserId: input.hit.kind === "vector-user" ? input.hit.id : null,
  });
}

export async function deleteLeaguePlayers(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  playerIds: string[],
): Promise<void> {
  if (playerIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("league_players")
    .delete()
    .eq("league_id", leagueId)
    .in("id", playerIds);

  if (error) {
    throw error;
  }
}

export async function updateLeaguePlayerRecord(
  supabase: SupabaseClient<Database>,
  input: {
    leagueId: string;
    playerId: string;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  },
): Promise<LeaguePlayer> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  const patch: Database["public"]["Tables"]["league_players"]["Update"] = {
    first_name: firstName,
    last_name: lastName,
    nickname: input.nickname?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
  };

  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }

  const { data, error } = await supabase
    .from("league_players")
    .update(patch)
    .eq("id", input.playerId)
    .eq("league_id", input.leagueId)
    .select(LEAGUE_PLAYER_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapLeaguePlayerRow(data as LeaguePlayerQueryRow);
}

export async function updateLeaguePlayersStatus(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  playerIds: string[],
  status: LeaguePlayerStatus,
): Promise<void> {
  if (playerIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("league_players")
    .update({ status })
    .eq("league_id", leagueId)
    .in("id", playerIds);

  if (error) {
    throw error;
  }
}

export async function updateLeaguePlayersTeam(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  playerIds: string[],
  team: { id: string; name: string } | null,
): Promise<void> {
  if (playerIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("league_players")
    .update({
      team_id: team?.id ?? null,
      team_name: team?.name ?? null,
    })
    .eq("league_id", leagueId)
    .in("id", playerIds);

  if (error) {
    throw error;
  }
}

export async function markLeaguePlayersInvited(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  playerIds: string[],
): Promise<void> {
  if (playerIds.length === 0) {
    return;
  }

  const { data, error: loadError } = await supabase
    .from("league_players")
    .select(LEAGUE_PLAYER_SELECT)
    .eq("league_id", leagueId)
    .in("id", playerIds);

  if (loadError) {
    throw loadError;
  }

  await Promise.all(
    (data ?? []).map(async (row) => {
      if (asVectorAccount(row.vector_account) === "connected") {
        return;
      }

      const currentStatus = asStatus(row.status);
      const nextStatus =
        currentStatus === "inactive" || currentStatus === "active"
          ? "invited"
          : currentStatus;
      const currentVector = asVectorAccount(row.vector_account);
      const nextVector =
        currentVector === "no-account" || currentVector === "profile-only"
          ? "invitation-pending"
          : currentVector;

      const { error } = await supabase
        .from("league_players")
        .update({
          status: nextStatus,
          vector_account: nextVector,
        })
        .eq("id", row.id)
        .eq("league_id", leagueId);

      if (error) {
        throw error;
      }
    }),
  );
}
