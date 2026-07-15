import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SeasonRow } from "@/lib/supabase/database.types";

const SEASON_SELECT = `
  id,
  organization_id,
  name,
  slug,
  created_by,
  created_at,
  updated_at
` as const;

const ORGANIZATION_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchSeasonsForOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<SeasonRow[]> {
  const trimmedId = organizationId.trim();

  if (!trimmedId || !ORGANIZATION_ID_UUID_RE.test(trimmedId)) {
    return [];
  }

  const { data, error } = await supabase
    .from("seasons")
    .select(SEASON_SELECT)
    .eq("organization_id", trimmedId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createSeason(
  supabase: SupabaseClient<Database>,
  input: { organizationId: string; name: string },
): Promise<SeasonRow> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Season name is required.");
  }

  if (!input.organizationId) {
    throw new Error("Select a venue for this season.");
  }

  const { data, error } = await supabase.rpc("create_season", {
    org_id: input.organizationId,
    season_name: trimmedName,
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
      throw new Error("You cannot create a season for this venue.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to create season.");
  }

  return data;
}
