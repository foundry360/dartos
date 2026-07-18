import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DraftLeagueMatch,
  LeagueScheduleModel,
  ScheduleFrequency,
  SchedulePattern,
  ScheduleRules,
  ScheduleStatus,
} from "@/features/leagues/lib/league-schedule";
import type {
  Database,
  LeagueMatchRow,
  LeagueScheduleRow,
} from "@/lib/supabase/database.types";

function mapBoardFormat(
  value: string | null | undefined,
): DraftLeagueMatch["boardFormat"] {
  return value === "singles" || value === "doubles" ? value : null;
}

function mapMatch(row: LeagueMatchRow): DraftLeagueMatch {
  const homeKind = row.home_team_id ? "team" : "player";
  const awayKind = row.away_team_id ? "team" : "player";

  return {
    key: row.id,
    weekNumber: row.week_number,
    scheduledAt: row.scheduled_at,
    homeId: row.home_team_id ?? row.home_player_id,
    awayId: row.away_team_id ?? row.away_player_id,
    homeLabel: row.home_label,
    awayLabel: row.away_label,
    homeKind,
    awayKind,
    sortOrder: row.sort_order,
    status: row.status as DraftLeagueMatch["status"],
    boardFormat: mapBoardFormat(row.board_format),
    boardSlot: row.board_slot,
    lineupRound: row.lineup_round,
  };
}

function mapSchedule(
  schedule: LeagueScheduleRow,
  matches: LeagueMatchRow[],
): LeagueScheduleModel {
  return {
    id: schedule.id,
    leagueId: schedule.league_id,
    status: schedule.status as ScheduleStatus,
    frequency: schedule.frequency as ScheduleFrequency,
    matchWeekday: schedule.match_weekday,
    matchTime: schedule.match_time,
    weeks: schedule.weeks,
    matchesPerNight: schedule.matches_per_night,
    pattern: schedule.pattern as SchedulePattern,
    publishedAt: schedule.published_at,
    matches: matches
      .map(mapMatch)
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.sortOrder - b.sortOrder ||
          a.scheduledAt.localeCompare(b.scheduledAt),
      ),
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at,
  };
}

export async function fetchLeagueSchedule(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeagueScheduleModel | null> {
  const { data: schedule, error } = await supabase
    .from("league_schedules")
    .select("*")
    .eq("league_id", leagueId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load schedule.");
  }

  if (!schedule) {
    return null;
  }

  const { data: matches, error: matchesError } = await supabase
    .from("league_matches")
    .select("*")
    .eq("schedule_id", schedule.id)
    .order("week_number", { ascending: true })
    .order("sort_order", { ascending: true });

  if (matchesError) {
    throw new Error(matchesError.message || "Unable to load matches.");
  }

  return mapSchedule(schedule, matches ?? []);
}

export interface SaveLeagueScheduleInput {
  leagueId: string;
  rules: ScheduleRules;
  matches: DraftLeagueMatch[];
  publish: boolean;
}

export async function saveLeagueSchedule(
  supabase: SupabaseClient<Database>,
  input: SaveLeagueScheduleInput,
): Promise<LeagueScheduleModel> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to save a schedule.");
  }

  if (input.matches.length === 0) {
    throw new Error("Generate at least one match before saving.");
  }

  const existing = await fetchLeagueSchedule(supabase, input.leagueId);
  const publishedAt = input.publish ? new Date().toISOString() : null;
  const status: ScheduleStatus = input.publish ? "published" : "draft";

  let scheduleId = existing?.id;

  if (scheduleId) {
    const { error } = await supabase
      .from("league_schedules")
      .update({
        status,
        frequency: input.rules.frequency,
        match_weekday: input.rules.matchWeekday,
        match_time: input.rules.matchTime,
        weeks: input.rules.weeks,
        matches_per_night: input.rules.matchesPerNight,
        pattern: input.rules.pattern,
        published_at: publishedAt ?? existing?.publishedAt ?? null,
      })
      .eq("id", scheduleId);

    if (error) {
      throw new Error(error.message || "Unable to update schedule.");
    }

    const { error: deleteError } = await supabase
      .from("league_matches")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteError) {
      throw new Error(deleteError.message || "Unable to replace matches.");
    }
  } else {
    const { data, error } = await supabase
      .from("league_schedules")
      .insert({
        league_id: input.leagueId,
        status,
        frequency: input.rules.frequency,
        match_weekday: input.rules.matchWeekday,
        match_time: input.rules.matchTime,
        weeks: input.rules.weeks,
        matches_per_night: input.rules.matchesPerNight,
        pattern: input.rules.pattern,
        published_at: publishedAt,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Unable to create schedule.");
    }

    scheduleId = data.id;
  }

  const rows = input.matches.map((match) => ({
    league_id: input.leagueId,
    schedule_id: scheduleId!,
    week_number: match.weekNumber,
    scheduled_at: match.scheduledAt,
    home_team_id: match.homeKind === "team" ? match.homeId : null,
    away_team_id: match.awayKind === "team" ? match.awayId : null,
    home_player_id: match.homeKind === "player" ? match.homeId : null,
    away_player_id: match.awayKind === "player" ? match.awayId : null,
    home_label: match.homeLabel,
    away_label: match.awayLabel,
    status: match.status,
    sort_order: match.sortOrder,
    board_format: match.boardFormat ?? null,
    board_slot: match.boardSlot ?? null,
    lineup_round: match.lineupRound ?? null,
  }));

  const { error: insertError } = await supabase.from("league_matches").insert(rows);

  if (insertError) {
    throw new Error(insertError.message || "Unable to save matches.");
  }

  const saved = await fetchLeagueSchedule(supabase, input.leagueId);

  if (!saved) {
    throw new Error("Unable to load saved schedule.");
  }

  return saved;
}

export async function updateLeagueMatchStatus(
  supabase: SupabaseClient<Database>,
  input: {
    matchId: string;
    status: DraftLeagueMatch["status"];
  },
): Promise<void> {
  const { error } = await supabase
    .from("league_matches")
    .update({ status: input.status })
    .eq("id", input.matchId);

  if (error) {
    throw new Error(error.message || "Unable to update match status.");
  }
}

export async function updateLeagueMatchParticipant(
  supabase: SupabaseClient<Database>,
  input: {
    matchId: string;
    side: "home" | "away";
    participant: {
      id: string;
      label: string;
      kind: "team" | "player";
    };
  },
): Promise<void> {
  const patch =
    input.side === "home"
      ? {
          home_team_id: input.participant.kind === "team" ? input.participant.id : null,
          home_player_id:
            input.participant.kind === "player" ? input.participant.id : null,
          home_label: input.participant.label,
        }
      : {
          away_team_id: input.participant.kind === "team" ? input.participant.id : null,
          away_player_id:
            input.participant.kind === "player" ? input.participant.id : null,
          away_label: input.participant.label,
        };

  const { error } = await supabase
    .from("league_matches")
    .update(patch)
    .eq("id", input.matchId);

  if (error) {
    throw new Error(error.message || "Unable to update match.");
  }
}

export async function publishLeagueSchedule(
  supabase: SupabaseClient<Database>,
  leagueId: string,
): Promise<LeagueScheduleModel> {
  const existing = await fetchLeagueSchedule(supabase, leagueId);

  if (!existing) {
    throw new Error("Create a schedule before publishing.");
  }

  const { error } = await supabase
    .from("league_schedules")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    throw new Error(error.message || "Unable to publish schedule.");
  }

  const saved = await fetchLeagueSchedule(supabase, leagueId);

  if (!saved) {
    throw new Error("Unable to load published schedule.");
  }

  return saved;
}
