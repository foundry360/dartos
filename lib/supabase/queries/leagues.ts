import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  LeagueRow,
  OrganizationRow,
  SeasonRow,
} from "@/lib/supabase/database.types";
import {
  datetimeLocalToIso,
  isLeagueFormat,
  type LeagueFormat,
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
  starts_at,
  ends_at,
  created_by,
  created_at,
  updated_at
` as const;

export interface CreateLeagueInput {
  organizationId: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  format: LeagueFormat | string;
  startsAtLocal: string;
  endsAtLocal: string;
  description?: string | null;
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
    .select(
      `
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
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const leagues: LeagueWithVenue[] = [];

  for (const row of data ?? []) {
    const organization = row.organization as
      | Pick<OrganizationRow, "id" | "name" | "slug">
      | Pick<OrganizationRow, "id" | "name" | "slug">[]
      | null;
    const org = Array.isArray(organization) ? organization[0] : organization;

    const season = row.season as
      | Pick<SeasonRow, "id" | "name" | "slug">
      | Pick<SeasonRow, "id" | "name" | "slug">[]
      | null;
    const seasonRow = Array.isArray(season) ? season[0] : season;

    if (!org) {
      continue;
    }

    leagues.push({
      league: {
        id: row.id,
        organization_id: row.organization_id,
        season_id: row.season_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        format: row.format,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      organization: org,
      season: seasonRow ?? null,
    });
  }

  return leagues;
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
    throw new Error("Select a league format.");
  }

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

  const { data, error } = await supabase.rpc("create_league", {
    org_id: input.organizationId,
    league_name: trimmedName,
    season_id: seasonId,
    league_format: input.format,
    league_starts_at: startsAt,
    league_ends_at: endsAt,
    league_description: trimmedDescription,
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
