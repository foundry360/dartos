"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SegmentedTabs,
  type SegmentedTabOption,
} from "@/components/ui/SegmentedTabs";
import { LeagueMatchCard } from "@/features/leagues/components/LeagueMatchCard";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { LeagueMatchStatusBadge } from "@/features/leagues/components/LeagueMatchStatusBadge";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";
import {
  formatLeagueDate,
  formatLeagueTime,
} from "@/features/leagues/lib/league-formats";

type MatchesView = "cards" | "table";

function CardsViewIcon() {
  return (
    <svg
      className="league-match-view-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function TableViewIcon() {
  return (
    <svg
      className="league-match-view-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

const MATCH_VIEW_OPTIONS: Array<SegmentedTabOption<MatchesView>> = [
  { value: "cards", label: <CardsViewIcon />, ariaLabel: "Cards view" },
  { value: "table", label: <TableViewIcon />, ariaLabel: "Table view" },
];

interface LeagueDetailMatchesProps {
  leagueId: string;
  isSingles?: boolean;
  onSelectSection?: (section: LeagueDetailSectionId) => void;
}

export function LeagueDetailMatches({
  leagueId,
  isSingles = false,
  onSelectSection,
}: LeagueDetailMatchesProps) {
  const router = useRouter();
  const {
    schedule,
    loading: scheduleLoading,
    error,
  } = useLeagueSchedule(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);
  const night = useLeagueNight({
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished: schedule?.status === "published",
  });
  const [view, setView] = useState<MatchesView>("cards");

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const matches = schedule?.matches ?? [];
  const loading =
    scheduleLoading || playersLoading || teamsLoading || !night.hydrated;

  const openMatch = (matchKey: string) => {
    router.push(`/leagues/league/${leagueId}/match/${matchKey}`);
  };

  if (loading) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading matches…</p>
          </div>
        </section>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Matches</h2>
          </div>
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="matches" />
            </div>
            <p className="league-empty__title">No matches yet</p>
            <p className="league-empty__sub">
              Generate and publish a schedule to populate match cards here.
            </p>
            {onSelectSection ? (
              <button
                type="button"
                className="league-btn league-btn--primary"
                onClick={() => onSelectSection("schedule")}
              >
                Create Schedule
              </button>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="league-players-admin">
      <section className="league-detail-card">
        <div className="league-detail-card__header league-match-toolbar">
          <div className="league-match-toolbar__meta">
            <h2 className="league-detail-card__title">Matches</h2>
            <p className="league-match-list__count">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </p>
          </div>
          <SegmentedTabs
            ariaLabel="Matches layout"
            className="league-match-view-toggle"
            options={MATCH_VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        </div>

        {error ? <p className="league-players__error">{error}</p> : null}

        {view === "cards" ? (
          <div className="league-match-list">
            {matches.map((match, index) => (
              <LeagueMatchCard
                key={match.key}
                matchNumber={index + 1}
                match={match}
                winnerSide={null}
                playersById={playersById}
                teamsById={teamsById}
                status={night.getMatchStatus(match)}
                onOpen={() => openMatch(match.key)}
              />
            ))}
          </div>
        ) : (
          <div className="league-match-table-wrap">
            <table className="league-match-table">
              <thead>
                <tr>
                  <th scope="col" className="league-match-table__week">
                    Week
                  </th>
                  <th scope="col" className="league-match-table__num">
                    Match
                  </th>
                  <th scope="col">Home</th>
                  <th scope="col">Away</th>
                  <th scope="col">When</th>
                  <th scope="col" className="league-match-table__status">
                    Status
                  </th>
                  <th scope="col" className="league-match-table__actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match, index) => {
                  const whenDate = formatLeagueDate(match.scheduledAt);
                  const whenTime = formatLeagueTime(match.scheduledAt);

                  return (
                    <tr
                      key={match.key}
                      onClick={() => openMatch(match.key)}
                    >
                      <td className="league-match-table__week">
                        {match.weekNumber}
                      </td>
                      <td className="league-match-table__num">{index + 1}</td>
                      <td className="league-match-table__side" title={match.homeLabel}>
                        {match.homeLabel}
                      </td>
                      <td className="league-match-table__side" title={match.awayLabel}>
                        {match.awayLabel}
                      </td>
                      <td className="league-match-table__when">
                        {[whenDate, whenTime].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="league-match-table__status">
                        <LeagueMatchStatusBadge
                          status={night.getMatchStatus(match)}
                        />
                      </td>
                      <td className="league-match-table__actions">
                        <button
                          type="button"
                          className="league-btn league-btn--ghost-dark"
                          onClick={(event) => {
                            event.stopPropagation();
                            openMatch(match.key);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
