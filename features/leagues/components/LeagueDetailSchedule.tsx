"use client";

import { useMemo, useState } from "react";
import {
  CreateScheduleWizard,
  type ScheduleLeagueSetupPersist,
} from "@/features/leagues/components/CreateScheduleWizard";
import { ScheduleMatchList } from "@/features/leagues/components/ScheduleMatchList";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import { applyMatchNightToLeagueDates } from "@/features/leagues/lib/league-formats";
import {
  groupMatchesByWeek,
  participantsFromLeague,
} from "@/features/leagues/lib/league-schedule";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import "@/features/leagues/league-schedule.css";

type ScheduleView = "wizard" | "schedule";

interface LeagueDetailScheduleProps {
  leagueEntry: LeagueWithVenue;
  onUpdateLeague: (input: UpdateLeagueInput) => Promise<unknown>;
  onCancelToOverview?: () => void;
}

export function LeagueDetailSchedule({
  leagueEntry,
  onUpdateLeague,
  onCancelToOverview,
}: LeagueDetailScheduleProps) {
  const league = leagueEntry.league;
  const { players } = useLeaguePlayers(league.id);
  const { teams } = useLeagueTeams(league.id);
  const { schedule, loading, saving, error, save, replaceParticipant } =
    useLeagueSchedule(league.id);
  const [forceWizard, setForceWizard] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [persistingLeague, setPersistingLeague] = useState(false);

  const weeks = useMemo(
    () => (schedule ? groupMatchesByWeek(schedule.matches) : []),
    [schedule],
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
        leagueType: league.format,
        teams,
        players,
      }),
    [league.format, players, teams],
  );

  const hasSchedule = Boolean(schedule && schedule.matches.length > 0);
  const view: ScheduleView =
    forceWizard || !hasSchedule ? "wizard" : "schedule";

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
      {view === "wizard" ? (
        <CreateScheduleWizard
          key={wizardKey}
          league={league}
          season={leagueEntry.season}
          teams={teams}
          players={players}
          saving={saving || persistingLeague}
          onCancel={
            hasSchedule
              ? () => {
                  setForceWizard(false);
                }
              : onCancelToOverview
          }
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
                seasonId: setup.seasonId,
                name: setup.name,
                format: setup.format,
                competitionFormat: setup.competitionFormat,
                gameFormat: setup.gameFormat,
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
            </div>
            <div className="league-schedule-header__actions">
              <span
                className={
                  schedule.status === "published"
                    ? "league-schedule-status league-schedule-status--published"
                    : "league-schedule-status league-schedule-status--draft"
                }
              >
                <span className="league-schedule-status__dot" aria-hidden />
                {schedule.status === "published" ? "Published" : "Draft"}
              </span>
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

          <ScheduleMatchList
            weeks={weeks}
            playersById={playersById}
            teamsById={teamsById}
            participants={participants}
            canReplaceSides
            onReplaceParticipant={async (input) => {
              await replaceParticipant(input);
              showToast("Match updated.");
            }}
          />
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
