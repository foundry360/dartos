import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export interface LeagueManagementActivityItem {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
}

function sortByOccurredAtDesc(
  items: LeagueManagementActivityItem[],
): LeagueManagementActivityItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

/** Recent management activity derived from leagues, venues, and roster rows. */
export async function fetchLeagueManagementActivity(
  supabase: SupabaseClient<Database>,
  limit = 8,
): Promise<LeagueManagementActivityItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const [leaguesResult, venuesResult, playersResult] = await Promise.all([
    supabase
      .from("leagues")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        organization:organizations ( name )
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("organizations")
      .select("id, name, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("league_players")
      .select(
        `
        id,
        first_name,
        last_name,
        created_at,
        league:leagues ( name )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (leaguesResult.error) {
    throw leaguesResult.error;
  }

  if (venuesResult.error) {
    throw venuesResult.error;
  }

  if (playersResult.error) {
    throw playersResult.error;
  }

  const items: LeagueManagementActivityItem[] = [];

  for (const row of leaguesResult.data ?? []) {
    const organization = Array.isArray(row.organization)
      ? row.organization[0]
      : row.organization;
    const venueName = organization?.name ?? "Venue";
    const createdAt = row.created_at;
    const updatedAt = row.updated_at;
    const wasUpdated =
      updatedAt &&
      createdAt &&
      new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;

    items.push({
      id: wasUpdated ? `league-updated-${row.id}` : `league-created-${row.id}`,
      title: wasUpdated ? "League updated" : "League created",
      detail: `${row.name} · ${venueName}`,
      occurredAt: wasUpdated ? updatedAt : createdAt,
    });
  }

  for (const row of venuesResult.data ?? []) {
    const createdAt = row.created_at;
    const updatedAt = row.updated_at;
    const wasUpdated =
      updatedAt &&
      createdAt &&
      new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;

    items.push({
      id: wasUpdated ? `venue-updated-${row.id}` : `venue-created-${row.id}`,
      title: wasUpdated ? "Venue updated" : "Venue created",
      detail: row.name,
      occurredAt: wasUpdated ? updatedAt : createdAt,
    });
  }

  for (const row of playersResult.data ?? []) {
    const league = Array.isArray(row.league) ? row.league[0] : row.league;
    const playerName = `${row.first_name} ${row.last_name}`.trim() || "Player";

    items.push({
      id: `player-added-${row.id}`,
      title: "Player added",
      detail: `${playerName}${league?.name ? ` · ${league.name}` : ""}`,
      occurredAt: row.created_at,
    });
  }

  return sortByOccurredAtDesc(items).slice(0, limit);
}
