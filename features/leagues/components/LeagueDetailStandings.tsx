"use client";

import { useMemo } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { useLeagueDetailData } from "@/features/leagues/hooks/LeagueDetailDataContext";
import {
  applyNightResultsToPlayers,
  applyNightResultsToTeams,
  buildResultsFromMatches,
} from "@/features/leagues/lib/league-night-results";
import {
  buildSinglesStandings,
  buildTeamStandings,
  formatLegDiff,
  formatWinPercent,
} from "@/features/leagues/lib/league-standings";

interface LeagueDetailStandingsProps {
  leagueId: string;
  isSingles: boolean;
}

export function LeagueDetailStandings({
  isSingles,
}: LeagueDetailStandingsProps) {
  const {
    players: { players, loading: playersLoading },
    teams: { teams, loading: teamsLoading },
    schedule: { schedule, loading: scheduleLoading },
  } = useLeagueDetailData();

  const nightResults = useMemo(
    () => buildResultsFromMatches(schedule?.matches ?? []),
    [schedule?.matches],
  );

  const rows = useMemo(() => {
    if (isSingles) {
      return buildSinglesStandings(
        applyNightResultsToPlayers(players, nightResults),
      );
    }

    return buildTeamStandings(applyNightResultsToTeams(teams, nightResults));
  }, [isSingles, players, teams, nightResults]);

  const loading = isSingles
    ? playersLoading || scheduleLoading
    : teamsLoading || scheduleLoading;
  const entityLabel = isSingles ? "Player" : "Team";

  if (loading) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading standings…</p>
          </div>
        </section>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="standings" />
            </div>
            <p className="league-empty__title">No standings yet</p>
            <p className="league-empty__sub">
              {isSingles
                ? "Standings will appear once players are added and matches are played."
                : "Standings will appear once teams are created and matches are played."}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="league-players-admin">
      <section className="league-detail-card league-players-table-card">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">Standings</h2>
          <p className="league-match-list__count">
            {rows.length} {isSingles ? "player" : "team"}
            {rows.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="league-players-table-wrap">
          <table className="league-players-table league-standings-table">
            <thead>
              <tr>
                <th className="league-standings-table__rank">Rank</th>
                <th className="league-standings-table__name">{entityLabel}</th>
                <th className="league-standings-table__num">Played</th>
                <th className="league-standings-table__num">Wins</th>
                <th className="league-standings-table__num">Losses</th>
                <th className="league-standings-table__num">Points</th>
                <th className="league-standings-table__num">Win %</th>
                <th className="league-standings-table__num">Leg Diff</th>
                <th className="league-standings-table__num">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="league-standings-table__rank">{row.rank}</td>
                  <td className="league-standings-table__name">
                    <div className="league-players-table__player">
                      <PlayerAvatar
                        name={row.name}
                        color={row.color}
                        avatarUrl={row.avatarUrl}
                        size="sm"
                      />
                      <p className="league-players-table__name">{row.name}</p>
                    </div>
                  </td>
                  <td className="league-standings-table__num">{row.played}</td>
                  <td className="league-standings-table__num">{row.wins}</td>
                  <td className="league-standings-table__num">{row.losses}</td>
                  <td className="league-standings-table__num league-standings-table__points">
                    {row.points}
                  </td>
                  <td className="league-standings-table__num">
                    {formatWinPercent(row.winPercent)}
                  </td>
                  <td className="league-standings-table__num">
                    {formatLegDiff(row.legDiff)}
                  </td>
                  <td className="league-standings-table__num">{row.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
