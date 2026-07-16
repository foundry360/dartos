"use client";

import { useEffect, useMemo, useState } from "react";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { TimePickerField } from "@/components/ui/TimePickerField";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  defaultMatchesPerNight,
  defaultScheduleRulesFromLeague,
  generateSchedulePreview,
  groupMatchesByWeek,
  participantsFromLeague,
  SCHEDULE_FREQUENCY_OPTIONS,
  SCHEDULE_PATTERN_OPTIONS,
  weekdayOptions,
  type DraftLeagueMatch,
  type ScheduleFrequency,
  type SchedulePattern,
  type ScheduleRules,
} from "@/features/leagues/lib/league-schedule";
import {
  isLeagueCompetitionFormat,
  isLeagueFormat,
  isLeagueGameFormat,
  LEAGUE_COMPETITION_FORMAT_OPTIONS,
  LEAGUE_FORMAT_OPTIONS,
  LEAGUE_GAME_FORMAT_OPTIONS,
  normalizeLeagueGameFormat,
  type LeagueCompetitionFormat,
  type LeagueFormat,
  type LeagueGameFormat,
} from "@/features/leagues/lib/league-formats";
import {
  replaceMatchParticipant,
  ScheduleMatchList,
} from "@/features/leagues/components/ScheduleMatchList";
import { getSampleSeasonsForOrganization } from "@/features/leagues/lib/sample-league-dashboard";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { createClient } from "@/lib/supabase/client";
import type { LeagueRow, SeasonRow } from "@/lib/supabase/database.types";
import { fetchSeasonsForOrganization } from "@/lib/supabase/queries/seasons";
import "@/features/leagues/league-schedule.css";

const ORGANIZATION_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STEPS = [
  "League Setup",
  "Schedule Rules",
  "Review Schedule",
  "Ready to Publish",
] as const;

export interface ScheduleLeagueSetupPersist {
  name: string;
  format: LeagueFormat;
  competitionFormat: LeagueCompetitionFormat;
  gameFormat: LeagueGameFormat;
  seasonId: string;
  matchWeekday: number | null;
  matchTime: string;
}

interface CreateScheduleWizardProps {
  league: LeagueRow;
  season: Pick<SeasonRow, "id" | "name" | "slug"> | null;
  teams: LeagueTeam[];
  players: LeaguePlayer[];
  saving?: boolean;
  onCancel?: () => void;
  onPersistLeague: (input: ScheduleLeagueSetupPersist) => Promise<void>;
  onSave: (input: {
    rules: ScheduleRules;
    matches: DraftLeagueMatch[];
    publish: boolean;
  }) => Promise<void>;
}

export function CreateScheduleWizard({
  league,
  season,
  teams,
  players,
  saving = false,
  onCancel,
  onPersistLeague,
  onSave,
}: CreateScheduleWizardProps) {
  const [step, setStep] = useState(0);
  const [leagueName, setLeagueName] = useState(league.name);
  const [leagueType, setLeagueType] = useState<LeagueFormat | "">(
    league.format && isLeagueFormat(league.format) ? league.format : "",
  );
  const [competitionFormat, setCompetitionFormat] = useState<
    LeagueCompetitionFormat | ""
  >(
    league.competition_format &&
      isLeagueCompetitionFormat(league.competition_format)
      ? league.competition_format
      : "",
  );
  const [gameFormat, setGameFormat] = useState<LeagueGameFormat | "">(
    normalizeLeagueGameFormat(league.game_format) ?? "",
  );
  const [seasonId, setSeasonId] = useState(
    league.season_id ?? season?.id ?? "",
  );
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [rules, setRules] = useState<ScheduleRules>(() => {
    const base = defaultScheduleRulesFromLeague(league);
    const initialParticipants = participantsFromLeague({
      leagueType: league.format,
      teams,
      players,
    });

    return {
      ...base,
      matchesPerNight: defaultMatchesPerNight(initialParticipants.length),
    };
  });
  const [matchesPerNightTouched, setMatchesPerNightTouched] = useState(false);
  const [matches, setMatches] = useState<DraftLeagueMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [persistingLeague, setPersistingLeague] = useState(false);
  const busy = saving || persistingLeague || seasonsLoading;

  useEffect(() => {
    let cancelled = false;
    const organizationId = league.organization_id;

    const loadSeasons = async () => {
      setSeasonsLoading(true);

      const ensureCurrentSeason = (list: SeasonRow[]) => {
        if (!season || list.some((entry) => entry.id === season.id)) {
          return list;
        }

        return [
          {
            id: season.id,
            organization_id: organizationId,
            name: season.name,
            slug: season.slug,
            created_by: league.created_by,
            created_at: league.created_at,
            updated_at: league.updated_at,
          },
          ...list,
        ];
      };

      try {
        if (!ORGANIZATION_ID_UUID_RE.test(organizationId)) {
          if (!cancelled) {
            setSeasons(
              ensureCurrentSeason(getSampleSeasonsForOrganization(organizationId)),
            );
          }
          return;
        }

        const supabase = createClient();

        if (!supabase) {
          if (!cancelled) {
            setSeasons(
              ensureCurrentSeason(getSampleSeasonsForOrganization(organizationId)),
            );
          }
          return;
        }

        const remote = await fetchSeasonsForOrganization(
          supabase,
          organizationId,
        );

        if (!cancelled) {
          setSeasons(ensureCurrentSeason(remote));
        }
      } catch {
        if (!cancelled) {
          setSeasons(
            ensureCurrentSeason(getSampleSeasonsForOrganization(organizationId)),
          );
        }
      } finally {
        if (!cancelled) {
          setSeasonsLoading(false);
        }
      }
    };

    void loadSeasons();

    return () => {
      cancelled = true;
    };
  }, [league.created_at, league.created_by, league.organization_id, league.updated_at, season]);

  const seasonOptions = useMemo(
    () =>
      seasons.map((entry) => ({
        value: entry.id,
        label: entry.name,
      })),
    [seasons],
  );

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const participants = useMemo(
    () =>
      participantsFromLeague({
        leagueType: leagueType || league.format,
        teams,
        players,
      }),
    [league.format, leagueType, players, teams],
  );

  useEffect(() => {
    if (matchesPerNightTouched || participants.length < 2) {
      return;
    }

    const fullRound = defaultMatchesPerNight(participants.length);
    setRules((current) =>
      current.matchesPerNight === fullRound
        ? current
        : { ...current, matchesPerNight: fullRound },
    );
  }, [matchesPerNightTouched, participants.length]);

  const weeks = useMemo(() => groupMatchesByWeek(matches), [matches]);
  const fullRoundMatches = defaultMatchesPerNight(participants.length);

  const generate = () => {
    setError(null);

    if (participants.length < 2) {
      setError(
        (leagueType || league.format) === "singles"
          ? "Add at least two players before generating a schedule."
          : "Add at least two teams (or players) before generating a schedule.",
      );
      return false;
    }

    if (rules.pattern === "custom") {
      setError("Custom matchups coming soon. Choose Round Robin for now.");
      return false;
    }

    const next = generateSchedulePreview({ league, rules, participants });

    if (next.length === 0) {
      setError("Unable to generate matchups with the current rules.");
      return false;
    }

    setMatches(next);
    return true;
  };

  const goNext = async () => {
    setError(null);

    if (step === 0) {
      const trimmedName = leagueName.trim();

      if (!trimmedName) {
        setError("League name is required.");
        return;
      }

      if (!leagueType || !isLeagueFormat(leagueType)) {
        setError("Select a league type.");
        return;
      }

      if (
        !competitionFormat ||
        !isLeagueCompetitionFormat(competitionFormat)
      ) {
        setError("Select a league format.");
        return;
      }

      if (!gameFormat || !isLeagueGameFormat(gameFormat)) {
        setError("Select a game format.");
        return;
      }

      if (!seasonId.trim()) {
        setError("Select a season.");
        return;
      }

      setPersistingLeague(true);

      try {
        await onPersistLeague({
          name: trimmedName,
          format: leagueType,
          competitionFormat,
          gameFormat,
          seasonId: seasonId.trim(),
          matchWeekday: rules.matchWeekday,
          matchTime: rules.matchTime,
        });
        setStep(1);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save league details.",
        );
      } finally {
        setPersistingLeague(false);
      }

      return;
    }

    if (step === 1) {
      if (!generate()) {
        return;
      }
      setStep(2);
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
    }
  };

  const finish = async (publish: boolean) => {
    setError(null);

    try {
      await onSave({ rules, matches, publish });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : publish
            ? "Unable to publish schedule."
            : "Unable to save schedule.",
      );
    }
  };

  return (
    <section className="league-detail-card schedule-wizard-card">
      <div className="schedule-wizard">
        <ol className="schedule-wizard__steps" aria-label="Schedule wizard progress">
          {STEPS.map((label, index) => {
            const state =
              index < step ? "is-complete" : index === step ? "is-current" : "";

            return (
              <li
                key={label}
                className={
                  state
                    ? `schedule-wizard__step ${state}`
                    : "schedule-wizard__step"
                }
              >
                <span className="schedule-wizard__step-name">{label}</span>
                <span className="schedule-wizard__step-track" aria-hidden>
                  <span className="schedule-wizard__step-line schedule-wizard__step-line--start" />
                  <span className="schedule-wizard__dot">
                    {index < step ? (
                      <svg
                        className="schedule-wizard__dot-check"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3.5 8.25 6.5 11.25 12.5 4.75"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="schedule-wizard__step-line schedule-wizard__step-line--end" />
                </span>
              </li>
            );
          })}
        </ol>

        {step === 0 ? (
          <>
            <div className="schedule-inline-fields">
              <label className="schedule-inline-field schedule-inline-field--wide">
                <span className="schedule-inline-field__label">League Name</span>
                <input
                  className="setup-input schedule-inline-field__control"
                  value={leagueName}
                  onChange={(event) => setLeagueName(event.target.value)}
                  disabled={busy}
                />
              </label>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">League Type</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="League Type"
                    value={leagueType}
                    options={LEAGUE_FORMAT_OPTIONS}
                    onChange={setLeagueType}
                    placeholder="Select league type"
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">League Format</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="League Format"
                    value={competitionFormat}
                    options={LEAGUE_COMPETITION_FORMAT_OPTIONS}
                    onChange={setCompetitionFormat}
                    placeholder="Select league format"
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Game Format</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Game Format"
                    value={gameFormat}
                    options={LEAGUE_GAME_FORMAT_OPTIONS}
                    onChange={setGameFormat}
                    placeholder="Select game format"
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Season</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Season"
                    value={seasonId}
                    options={seasonOptions}
                    onChange={setSeasonId}
                    placeholder={
                      seasonsLoading ? "Loading seasons..." : "Select a season"
                    }
                    allowClear={false}
                    disabled={busy}
                    emptyLabel="No seasons yet"
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Match Day</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Match Day"
                    value={
                      rules.matchWeekday == null
                        ? ""
                        : String(rules.matchWeekday)
                    }
                    options={weekdayOptions()}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        matchWeekday: value === "" ? null : Number(value),
                      }))
                    }
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Match Time</span>
                <div className="schedule-inline-field__control">
                  <TimePickerField
                    label="Match Time"
                    value={rules.matchTime}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        matchTime: value || "19:00",
                      }))
                    }
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Players</span>
                <span className="schedule-inline-field__value">
                  {players.length}
                </span>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Teams</span>
                <span className="schedule-inline-field__value">
                  {teams.length}
                </span>
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="schedule-inline-fields">
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Frequency</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Frequency"
                    value={rules.frequency}
                    options={SCHEDULE_FREQUENCY_OPTIONS}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        frequency: value as ScheduleFrequency,
                      }))
                    }
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Match Day</span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Match Day"
                    value={
                      rules.matchWeekday == null
                        ? ""
                        : String(rules.matchWeekday)
                    }
                    options={weekdayOptions()}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        matchWeekday: value === "" ? null : Number(value),
                      }))
                    }
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">Match Time</span>
                <div className="schedule-inline-field__control">
                  <TimePickerField
                    label="Match Time"
                    value={rules.matchTime}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        matchTime: value || "19:00",
                      }))
                    }
                    disabled={busy}
                  />
                </div>
              </div>
              <label className="schedule-inline-field">
                <span className="schedule-inline-field__label">
                  Number of Weeks
                </span>
                <input
                  type="number"
                  min={1}
                  max={52}
                  step={1}
                  className="setup-input schedule-inline-field__control"
                  value={rules.weeks}
                  onChange={(event) =>
                    setRules((current) => ({
                      ...current,
                      weeks: Math.max(
                        1,
                        Number.parseInt(event.target.value, 10) || 1,
                      ),
                    }))
                  }
                  disabled={busy}
                />
              </label>
              <label className="schedule-inline-field">
                <span className="schedule-inline-field__label">
                  Matches Per Night
                </span>
                <input
                  type="number"
                  min={1}
                  max={32}
                  step={1}
                  className="setup-input schedule-inline-field__control"
                  value={rules.matchesPerNight}
                  onChange={(event) => {
                    setMatchesPerNightTouched(true);
                    setRules((current) => ({
                      ...current,
                      matchesPerNight: Math.max(
                        1,
                        Number.parseInt(event.target.value, 10) || 1,
                      ),
                    }));
                  }}
                  disabled={busy}
                />
              </label>
              <div className="schedule-inline-field">
                <span className="schedule-inline-field__label">
                  Schedule Pattern
                </span>
                <div className="schedule-inline-field__control">
                  <OptionPickerField
                    label="Schedule Pattern"
                    value={rules.pattern}
                    options={SCHEDULE_PATTERN_OPTIONS}
                    onChange={(value) =>
                      setRules((current) => ({
                        ...current,
                        pattern: value as SchedulePattern,
                      }))
                    }
                    allowClear={false}
                    disabled={busy}
                  />
                </div>
              </div>
            </div>
            <p className="schedule-rules-form__hint">
              {(leagueType || league.format) === "singles"
                ? `${participants.length} player${participants.length === 1 ? "" : "s"} will be used for matchups.`
                : `${participants.length} team${participants.length === 1 ? "" : "s"} will be used for matchups.`}{" "}
              A full round is {fullRoundMatches} match
              {fullRoundMatches === 1 ? "" : "es"} per night so everyone plays
              once.
            </p>
          </>
        ) : null}

        {step === 2 ? (
          <ScheduleMatchList
            weeks={weeks}
            playersById={playersById}
            teamsById={teamsById}
            participants={participants}
            canReplaceSides
            onReplaceParticipant={({ matchKey, side, participant }) => {
              setMatches((current) =>
                current.map((match) =>
                  match.key === matchKey
                    ? replaceMatchParticipant(match, side, participant)
                    : match,
                ),
              );
            }}
          />
        ) : null}

        {step === 3 ? (
          <>
            <div className="schedule-publish-summary">
              <div className="schedule-publish-stat">
                <span className="schedule-publish-stat__value">{rules.weeks}</span>
                <span className="schedule-publish-stat__label">Weeks</span>
              </div>
              <div className="schedule-publish-stat">
                <span className="schedule-publish-stat__value">
                  {matches.length}
                </span>
                <span className="schedule-publish-stat__label">Matches</span>
              </div>
              <div className="schedule-publish-stat">
                <span className="schedule-publish-stat__value">
                  {participants.length}
                </span>
                <span className="schedule-publish-stat__label">
                  {participants[0]?.kind === "player" ? "Players" : "Teams"}
                </span>
              </div>
            </div>
            <ul className="schedule-publish-list">
              <li>Make the schedule visible to league members</li>
              <li>Enable match tracking for the season</li>
              <li>Create scheduled matches for directors</li>
            </ul>
          </>
        ) : null}

        {error ? <p className="schedule-wizard__error">{error}</p> : null}

        <div className="schedule-wizard__actions">
          {step > 0 ? (
            <TouchButton
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setError(null);
                if (step === 2) {
                  setStep(1);
                  return;
                }
                setStep((current) => Math.max(0, current - 1));
              }}
            >
              Back
            </TouchButton>
          ) : onCancel ? (
            <TouchButton
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel
            </TouchButton>
          ) : (
            <span />
          )}

          {step === 2 ? (
            <TouchButton
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (generate()) {
                  setError(null);
                }
              }}
            >
              Regenerate
            </TouchButton>
          ) : null}

          {step < 3 ? (
            <TouchButton
              type="button"
              disabled={busy}
              onClick={() => void goNext()}
            >
              {persistingLeague
                ? "Saving…"
                : step === 1
                  ? "Generate Schedule"
                  : "Next"}
            </TouchButton>
          ) : (
            <>
              <TouchButton
                type="button"
                variant="secondary"
                disabled={busy || matches.length === 0}
                onClick={() => void finish(false)}
              >
                Save Draft
              </TouchButton>
              <TouchButton
                type="button"
                disabled={busy || matches.length === 0}
                onClick={() => void finish(true)}
              >
                {saving ? "Publishing…" : "Publish Schedule"}
              </TouchButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
