"use client";

import { useMemo, useState } from "react";
import {
  CreateScheduleWizard,
  type ScheduleLeagueSetupPersist,
} from "@/features/leagues/components/CreateScheduleWizard";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import { applyMatchNightToLeagueDates } from "@/features/leagues/lib/league-formats";
import { groupMatchesByWeek } from "@/features/leagues/lib/league-schedule";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import "@/features/leagues/league-schedule.css";

type ScheduleView = "empty" | "wizard" | "schedule";

interface LeagueDetailScheduleProps {
  leagueEntry: LeagueWithVenue;
  onUpdateLeague: (input: UpdateLeagueInput) => Promise<unknown>;
}

export function LeagueDetailSchedule({
  leagueEntry,
  onUpdateLeague,
}: LeagueDetailScheduleProps) {
  const league = leagueEntry.league;
  const { players } = useLeaguePlayers(league.id);
  const { teams } = useLeagueTeams(league.id);
  const { schedule, loading, saving, error, save } = useLeagueSchedule(league.id);
  const [forceWizard, setForceWizard] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [persistingLeague, setPersistingLeague] = useState(false);

  const weeks = useMemo(
    () => (schedule ? groupMatchesByWeek(schedule.matches) : []),
    [schedule],
  );

  const hasSchedule = Boolean(schedule && schedule.matches.length > 0);

  const view: ScheduleView = forceWizard
    ? "wizard"
    : hasSchedule
      ? "schedule"
      : "empty";

  const openWizard = () => {
    setWizardKey((key) => key + 1);
    setForceWizard(true);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  if (loading) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading schedule…</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="league-players-admin">
      {view === "empty" ? (
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Schedule</h2>
          </div>
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="schedule" />
            </div>
            <p className="league-empty__title">
              Your league schedule has not been created yet.
            </p>
            <p className="league-empty__sub">
              Create a schedule to generate matchups, assign dates, and prepare
              your season.
            </p>
            <button
              type="button"
              className="league-btn league-btn--primary"
              onClick={openWizard}
            >
              Create Schedule
            </button>
          </div>
        </section>
      ) : null}

      {view === "wizard" ? (
        <CreateScheduleWizard
          key={wizardKey}
          league={league}
          seasonName={leagueEntry.season?.name ?? null}
          teams={teams}
          players={players}
          saving={saving || persistingLeague}
          onCancel={() => setForceWizard(false)}
          onPersistLeague={async (setup: ScheduleLeagueSetupPersist) => {
            setPersistingLeague(true);

            try {
              const { startsAtLocal, endsAtLocal } = applyMatchNightToLeagueDates(
                league.starts_at,
                league.ends_at,
                setup.matchWeekday,
                setup.matchTime,
              );

              await onUpdateLeague({
                leagueId: league.id,
                organizationId: league.organization_id,
                seasonId: league.season_id ?? undefined,
                seasonName:
                  setup.seasonName || leagueEntry.season?.name || undefined,
                name: setup.name,
                format: setup.format,
                competitionFormat: setup.competitionFormat,
                startsAtLocal,
                endsAtLocal,
                description: league.description,
                maxPlayers: league.max_players,
              });
            } finally {
              setPersistingLeague(false);
            }
          }}
          onSave={async (input) => {
            await save(input);
            setForceWizard(false);
            showToast(
              input.publish ? "Schedule published." : "Schedule draft saved.",
            );
          }}
        />
      ) : null}

      {view === "schedule" && schedule ? (
        <section className="league-detail-card">
          <div className="league-schedule-header">
            <div className="league-schedule-header__copy">
              <h2 className="league-detail-card__title">Schedule</h2>
              <p className="league-schedule-header__season">
                {leagueEntry.season?.name ?? league.name}
              </p>
              <span className="league-schedule-status">
                <span className="league-schedule-status__dot" aria-hidden />
                {schedule.status === "published" ? "Published" : "Draft"}
              </span>
            </div>
            <div className="league-schedule-header__actions">
              <button
                type="button"
                className="league-btn league-btn--ghost-dark"
                onClick={openWizard}
              >
                Edit Schedule
              </button>
              <button
                type="button"
                className="league-btn league-btn--ghost-dark"
                onClick={openWizard}
              >
                Regenerate
              </button>
              <button
                type="button"
                className="league-btn league-btn--ghost-dark"
                disabled
                title="Coming soon"
              >
                Export
              </button>
            </div>
          </div>

          <div className="league-schedule-weeks">
            {weeks.map((week) => (
              <section key={week.weekNumber} className="schedule-week">
                <div className="schedule-week__header">
                  <h3 className="schedule-week__title">Week {week.weekNumber}</h3>
                  <p className="schedule-week__meta">
                    {week.dateLabel} · {week.timeLabel}
                  </p>
                </div>
                <ul className="schedule-match-list">
                  {week.matches.map((match) => (
                    <li key={match.key} className="schedule-match-card">
                      <p className="schedule-match-card__vs">
                        {match.homeLabel} vs {match.awayLabel}
                      </p>
                      <div className="schedule-match-card__actions">
                        <button
                          type="button"
                          className="schedule-match-card__action"
                          disabled
                          title="Coming soon"
                        >
                          View Match
                        </button>
                        <button
                          type="button"
                          className="schedule-match-card__action"
                          disabled
                          title="Coming soon"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          className="schedule-match-card__action"
                          disabled
                          title="Coming soon"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="schedule-wizard__error" style={{ marginTop: "0.75rem" }}>
          {error}
        </p>
      ) : null}

      {toast ? (
        <div className="league-players-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
