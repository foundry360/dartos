import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  LeagueRow,
  OrganizationRow,
  SeasonRow,
} from "@/lib/supabase/database.types";
import {
  datetimeLocalToIso,
  isLeagueCompetitionFormat,
  isLeagueFormat,
  isLeagueGameFormat,
  type LeagueCompetitionFormat,
  type LeagueFormat,
  type LeagueGameFormat,
} from "@/features/leagues/lib/league-formats";
import { createSeason } from "@/lib/supabase/queries/seasons";

export interface LeagueWithVenue {
  league: LeagueRow;
  organization: Pick<OrganizationRow, "id" | "name" | "slug">;
  season: Pick<SeasonRow, "id" | "name" | "slug"> | null;
}

const LEAGUE_SELECT = `
  id,
  organization_id,
  season_id,
  name,
  slug,
  description,
  format,
  competition_format,
  game_format,
  max_players,
  starts_at,
  ends_at,
  published_at,
  created_by,
  created_at,
  updated_at
` as const;

const LEAGUE_WITH_RELATIONS_SELECT = `
  ${LEAGUE_SELECT},
  organization:organizations (
    id,
    name,
    slug
  ),
  season:seasons (
    id,
    name,
    slug
  )
` as const;

type LeagueQueryRow = LeagueRow & {
  organization:
    | Pick<OrganizationRow, "id" | "name" | "slug">
    | Pick<OrganizationRow, "id" | "name" | "slug">[]
    | null;
  season:
    | Pick<SeasonRow, "id" | "name" | "slug">
    | Pick<SeasonRow, "id" | "name" | "slug">[]
    | null;
};

function mapLeagueWithVenue(row: LeagueQueryRow): LeagueWithVenue | null {
  const organization = Array.isArray(row.organization)
    ? row.organization[0]
    : row.organization;
  const season = Array.isArray(row.season) ? row.season[0] : row.season;

  if (!organization) {
    return null;
  }

  return {
    league: {
      id: row.id,
      organization_id: row.organization_id,
      season_id: row.season_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      format: row.format,
      competition_format: row.competition_format,
      game_format: row.game_format,
      max_players: row.max_players,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      published_at: row.published_at,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    organization,
    season: season ?? null,
  };
}

export interface CreateLeagueInput {
  organizationId: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  format: LeagueFormat | string;
  competitionFormat?: LeagueCompetitionFormat | string | null;
  gameFormat?: LeagueGameFormat | string | null;
  startsAtLocal: string;
  endsAtLocal: string;
  description?: string | null;
  maxPlayers?: number | null;
}

export async function fetchMyLeagues(
  supabase: SupabaseClient<Database>,
): Promise<LeagueWithVenue[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("leagues")
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const leagues: LeagueWithVenue[] = [];

  for (const row of data ?? []) {
    const mapped = mapLeagueWithVenue(row as LeagueQueryRow);

    if (mapped) {
      leagues.push(mapped);
    }
  }

  return leagues;
}

/**
 * Leagues where the signed-in Vector user is a connected roster player.
 * Used by Elite / Club My Leagues (shown as soon as they are added to the roster).
 */
export async function fetchMyRegisteredLeagues(
  supabase: SupabaseClient<Database>,
): Promise<LeagueWithVenue[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("league_players")
    .select("league_id")
    .eq("profile_user_id", user.id)
    .eq("vector_account", "connected");

  if (membershipError) {
    throw membershipError;
  }

  const leagueIds = [
    ...new Set(
      (memberships ?? [])
        .map((row) => row.league_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (leagueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("leagues")
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .in("id", leagueIds)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  const leagues: LeagueWithVenue[] = [];

  for (const row of data ?? []) {
    const mapped = mapLeagueWithVenue(row as LeagueQueryRow);

    if (mapped) {
      leagues.push(mapped);
    }
  }

  return leagues;
}

const LEAGUE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchLeagueById(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeagueWithVenue | null> {
  const trimmedId = leagueId.trim();

  if (!trimmedId || !LEAGUE_ID_UUID_RE.test(trimmedId)) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("leagues")
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .eq("id", trimmedId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load league.");
  }

  if (!data) {
    return null;
  }

  return mapLeagueWithVenue(data as LeagueQueryRow);
}

export async function createLeague(
  supabase: SupabaseClient<Database>,
  input: CreateLeagueInput,
): Promise<LeagueWithVenue> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("League name is required.");
  }

  if (!input.organizationId) {
    throw new Error("Select a venue for this league.");
  }

  if (!isLeagueFormat(input.format)) {
    throw new Error("Select a league type.");
  }

  const competitionFormatRaw =
    input.competitionFormat?.toString().trim().toLowerCase() || "";

  if (!isLeagueCompetitionFormat(competitionFormatRaw)) {
    throw new Error("Select a league format.");
  }

  const competitionFormat = competitionFormatRaw;
  const gameFormatRaw =
    input.gameFormat?.toString().trim().toLowerCase() || "";

  if (!isLeagueGameFormat(gameFormatRaw)) {
    throw new Error("Select a game format.");
  }

  const gameFormat = gameFormatRaw;
  const startsAt = datetimeLocalToIso(input.startsAtLocal);
  const endsAt = datetimeLocalToIso(input.endsAtLocal);

  if (!startsAt) {
    throw new Error("Start date and time is required.");
  }

  if (!endsAt) {
    throw new Error("Finish date and time is required.");
  }

  if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    throw new Error("Finish must be on or after start.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to create a league.");
  }

  let seasonId = input.seasonId?.trim() || "";

  if (!seasonId) {
    const seasonName = input.seasonName?.trim() || "";

    if (!seasonName) {
      throw new Error("Select or create a season.");
    }

    const season = await createSeason(supabase, {
      organizationId: input.organizationId,
      name: seasonName,
    });
    seasonId = season.id;
  }

  const trimmedDescription = input.description?.trim() || null;
  const maxPlayers =
    input.maxPlayers != null && Number.isFinite(input.maxPlayers)
      ? Math.floor(input.maxPlayers)
      : null;

  if (maxPlayers != null && maxPlayers <= 0) {
    throw new Error("Maximum players must be greater than zero.");
  }

  const { data, error } = await supabase.rpc("create_league", {
    org_id: input.organizationId,
    league_name: trimmedName,
    season_id: seasonId,
    league_format: input.format,
    league_starts_at: startsAt,
    league_ends_at: endsAt,
    league_description: trimmedDescription,
    league_max_players: maxPlayers,
    league_competition_format: competitionFormat,
    league_game_format: gameFormat,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("elite subscription required") ||
      message.includes("league pro subscription required")
    ) {
      throw new Error("League Pro subscription is required for league management.");
    }

    if (message.includes("not allowed")) {
      throw new Error("You cannot create a league for this venue.");
    }

    if (message.includes("finish must be")) {
      throw new Error("Finish must be on or after start.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to create league.");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", data.organization_id)
    .maybeSingle();

  if (orgError) {
    throw orgError;
  }

  if (!organization) {
    throw new Error("Unable to load venue for league.");
  }

  let season: Pick<SeasonRow, "id" | "name" | "slug"> | null = null;

  if (data.season_id) {
    const { data: seasonRow, error: seasonError } = await supabase
      .from("seasons")
      .select("id, name, slug")
      .eq("id", data.season_id)
      .maybeSingle();

    if (seasonError) {
      throw seasonError;
    }

    season = seasonRow;
  }

  return {
    league: data,
    organization,
    season,
  };
}

export interface UpdateLeagueInput {
  leagueId: string;
  organizationId: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  format: LeagueFormat | string;
  competitionFormat?: LeagueCompetitionFormat | string | null;
  gameFormat?: LeagueGameFormat | string | null;
  startsAtLocal: string;
  endsAtLocal: string;
  description?: string | null;
  maxPlayers?: number | null;
}

export async function updateLeague(
  supabase: SupabaseClient<Database>,
  input: UpdateLeagueInput,
): Promise<LeagueWithVenue> {
  const trimmedName = input.name.trim();
  const trimmedLeagueId = input.leagueId.trim();

  if (!trimmedLeagueId) {
    throw new Error("League is required.");
  }

  if (!trimmedName) {
    throw new Error("League name is required.");
  }

  if (!input.organizationId) {
    throw new Error("Select a venue for this league.");
  }

  if (!isLeagueFormat(input.format)) {
    throw new Error("Select a league type.");
  }

  const competitionFormatRaw =
    input.competitionFormat?.toString().trim().toLowerCase() || "";

  if (!isLeagueCompetitionFormat(competitionFormatRaw)) {
    throw new Error("Select a league format.");
  }

  const competitionFormat = competitionFormatRaw;
  const gameFormatRaw =
    input.gameFormat?.toString().trim().toLowerCase() || "";

  if (!isLeagueGameFormat(gameFormatRaw)) {
    throw new Error("Select a game format.");
  }

  const gameFormat = gameFormatRaw;
  const startsAt = datetimeLocalToIso(input.startsAtLocal);
  const endsAt = datetimeLocalToIso(input.endsAtLocal);

  if (!startsAt) {
    throw new Error("Start date and time is required.");
  }

  if (!endsAt) {
    throw new Error("Finish date and time is required.");
  }

  if (new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    throw new Error("Finish must be on or after start.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to update this league.");
  }

  let seasonId = input.seasonId?.trim() || "";
  const nextSeasonName = input.seasonName?.trim() || "";

  if (!seasonId) {
    if (!nextSeasonName) {
      throw new Error("Select or create a season.");
    }

    const season = await createSeason(supabase, {
      organizationId: input.organizationId,
      name: nextSeasonName,
    });
    seasonId = season.id;
  } else if (nextSeasonName) {
    const { error: seasonError } = await supabase
      .from("seasons")
      .update({ name: nextSeasonName })
      .eq("id", seasonId);

    if (seasonError) {
      throw seasonError;
    }
  }

  const maxPlayers =
    input.maxPlayers != null && Number.isFinite(input.maxPlayers)
      ? Math.floor(input.maxPlayers)
      : null;

  if (maxPlayers != null && maxPlayers <= 0) {
    throw new Error("Maximum players must be greater than zero.");
  }

  const { data, error } = await supabase
    .from("leagues")
    .update({
      organization_id: input.organizationId,
      season_id: seasonId,
      name: trimmedName,
      format: input.format,
      competition_format: competitionFormat,
      game_format: gameFormat,
      max_players: maxPlayers,
      starts_at: startsAt,
      ends_at: endsAt,
      description: input.description?.trim() || null,
    })
    .eq("id", trimmedLeagueId)
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .single();

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("permission") ||
      message.includes("policy")
    ) {
      throw new Error("You do not have permission to edit this league.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to update league.");
  }

  const mapped = mapLeagueWithVenue(data as LeagueQueryRow);

  if (!mapped) {
    throw new Error("Unable to load updated league.");
  }

  return mapped;
}

export async function updateLeagueMaxPlayers(
  supabase: SupabaseClient<Database>,
  leagueId: string,
  maxPlayers: number,
): Promise<LeagueWithVenue> {
  const trimmedLeagueId = leagueId.trim();

  if (!trimmedLeagueId) {
    throw new Error("League is required.");
  }

  if (!Number.isFinite(maxPlayers) || maxPlayers <= 0) {
    throw new Error("Maximum players must be greater than zero.");
  }

  const nextMax = Math.floor(maxPlayers);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to update this league.");
  }

  const { data, error } = await supabase
    .from("leagues")
    .update({
      max_players: nextMax,
    })
    .eq("id", trimmedLeagueId)
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .single();

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("permission") ||
      message.includes("policy")
    ) {
      throw new Error("You do not have permission to update this league.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to update the player limit.");
  }

  const mapped = mapLeagueWithVenue(data as LeagueQueryRow);

  if (!mapped) {
    throw new Error("Unable to load updated league.");
  }

  return mapped;
}

export async function publishLeague(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeagueWithVenue> {
  const trimmedLeagueId = leagueId.trim();

  if (!trimmedLeagueId) {
    throw new Error("League is required.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to publish this league.");
  }

  const { data, error } = await supabase
    .from("leagues")
    .update({
      published_at: new Date().toISOString(),
    })
    .eq("id", trimmedLeagueId)
    .select(LEAGUE_WITH_RELATIONS_SELECT)
    .single();

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("permission") ||
      message.includes("policy")
    ) {
      throw new Error("You do not have permission to publish this league.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to publish league.");
  }

  const mapped = mapLeagueWithVenue(data as LeagueQueryRow);

  if (!mapped) {
    throw new Error("Unable to load published league.");
  }

  return mapped;
}
