"use client";

import { useMemo, useState } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { useLeagueDetailData } from "@/features/leagues/hooks/LeagueDetailDataContext";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import {
  applyNightResultsToPlayers,
  applyNightResultsToTeams,
  buildResultsFromMatches,
} from "@/features/leagues/lib/league-night-results";
import {
  averageMetricLabel,
  buildPlayerStatistics,
  buildStatisticLeaders,
  buildTeamStatistics,
  formatAverageMetric,
  formatLegDiff,
  formatWinPercent,
  resolveAverageMetric,
  sortPlayerStatistics,
  sortTeamStatistics,
  type PlayerStatSortKey,
  type StatSortDirection,
  type TeamStatSortKey,
} from "@/features/leagues/lib/league-statistics";

interface LeagueDetailStatisticsProps {
  leagueId: string;
  gameFormat: string | null | undefined;
  isSingles?: boolean;
}

function SortGlyph({
  active,
  direction,
}: {
  active: boolean;
  direction: StatSortDirection;
}) {
  if (!active) {
    return <span className="league-stats-sort__glyph" aria-hidden />;
  }

  return (
    <span className="league-stats-sort__glyph is-active" aria-hidden>
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

export function LeagueDetailStatistics({
  leagueId,
  gameFormat,
  isSingles = false,
}: LeagueDetailStatisticsProps) {
  const { league: liveLeagueEntry } = useLeagueDetail(leagueId);
  const {
    players: { players, loading: playersLoading },
    teams: { teams, loading: teamsLoading },
    schedule: { schedule, loading: scheduleLoading },
  } = useLeagueDetailData();

  const [playerSortKey, setPlayerSortKey] =
    useState<PlayerStatSortKey>("winPercent");
  const [teamSortKey, setTeamSortKey] = useState<TeamStatSortKey>("winPercent");
  const [playerSortDir, setPlayerSortDir] = useState<StatSortDirection>("desc");
  const [teamSortDir, setTeamSortDir] = useState<StatSortDirection>("desc");

  const matches = schedule?.matches ?? [];
  const nightResults = useMemo(
    () => buildResultsFromMatches(matches),
    [matches],
  );
  // Prefer a fresh league fetch so Edit / Schedule setup changes show MPR vs 3DA
  // even if the parent detail state was still holding the previous game format.
  const resolvedGameFormat =
    liveLeagueEntry?.league.game_format ?? gameFormat ?? null;
  const averageMetric = resolveAverageMetric(resolvedGameFormat);
  const averageLabel = averageMetricLabel(averageMetric);
  const scheduleReady =
    Boolean(schedule && matches.length > 0) ||
    schedule?.status === "published";

  const playersWithResults = useMemo(
    () => applyNightResultsToPlayers(players, nightResults),
    [players, nightResults],
  );
  const teamsWithResults = useMemo(
    () => applyNightResultsToTeams(teams, nightResults),
    [teams, nightResults],
  );

  const playerRows = useMemo(() => {
    if (!isSingles) {
      return [];
    }

    return sortPlayerStatistics(
      buildPlayerStatistics(playersWithResults),
      playerSortKey,
      playerSortDir,
    );
  }, [isSingles, playersWithResults, playerSortDir, playerSortKey]);

  const teamRows = useMemo(() => {
    if (isSingles) {
      return [];
    }

    return sortTeamStatistics(
      buildTeamStatistics(teamsWithResults),
      teamSortKey,
      teamSortDir,
    );
  }, [isSingles, teamSortDir, teamSortKey, teamsWithResults]);

  const leaders = useMemo(
    () => buildStatisticLeaders(playersWithResults),
    [playersWithResults],
  );

  const loading = playersLoading || teamsLoading || scheduleLoading;
  const rows = isSingles ? playerRows : teamRows;

  const togglePlayerSort = (key: PlayerStatSortKey) => {
    if (playerSortKey === key) {
      setPlayerSortDir((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setPlayerSortKey(key);
    setPlayerSortDir(key === "name" ? "asc" : "desc");
  };

  const toggleTeamSort = (key: TeamStatSortKey) => {
    if (teamSortKey === key) {
      setTeamSortDir((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setTeamSortKey(key);
    setTeamSortDir(key === "name" ? "asc" : "desc");
  };

  if (loading) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading statistics…</p>
          </div>
        </section>
      </div>
    );
  }

  if (!scheduleReady) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="statistics" />
            </div>
            <p className="league-empty__title">No statistics are available yet.</p>
            <p className="league-empty__sub">
              Statistics will appear after league matches have been completed.
            </p>
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
              <LeagueDetailSectionIcon section="statistics" />
            </div>
            <p className="league-empty__title">No statistics yet</p>
            <p className="league-empty__sub">
              {isSingles
                ? "Add players to start tracking statistics."
                : "Create teams to start tracking statistics."}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="league-players-admin">
      <div className="league-stats-leaders" aria-label="League leaders">
        {leaders.map((leader) => (
          <article key={leader.id} className="league-stats-leader-card">
            <p className="league-stats-leader-card__title">{leader.title}</p>
            <p className="league-stats-leader-card__value">{leader.valueLabel}</p>
            <div className="league-stats-leader-card__player">
              {leader.playerName !== "—" ? (
                <PlayerAvatar
                  name={leader.playerName}
                  color={leader.color}
                  avatarUrl={leader.avatarUrl}
                  size="sm"
                />
              ) : null}
              <p className="league-stats-leader-card__name">{leader.playerName}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="league-detail-card league-players-table-card">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">Statistics</h2>
        </div>

        {isSingles ? (
          <div className="league-players-table-wrap">
            <table className="league-players-table league-standings-table league-stats-table">
              <thead>
                <tr>
                  {(
                    [
                      { key: "rank", label: "Rank", className: "league-standings-table__rank" },
                      { key: "name", label: "Player", className: "league-standings-table__name" },
                      { key: "matches", label: "Matches", className: "league-standings-table__num" },
                      { key: "wins", label: "Wins", className: "league-standings-table__num" },
                      { key: "losses", label: "Losses", className: "league-standings-table__num" },
                      { key: "winPercent", label: "Win %", className: "league-standings-table__num" },
                      {
                        key: "average",
                        label: averageLabel,
                        className: "league-standings-table__num",
                      },
                      { key: "streak", label: "Streak", className: "league-standings-table__num" },
                    ] as const
                  ).map((column) => (
                    <th key={column.key} className={column.className}>
                      <button
                        type="button"
                        className="league-stats-sort"
                        onClick={() => togglePlayerSort(column.key)}
                      >
                        <span>{column.label}</span>
                        <SortGlyph
                          active={playerSortKey === column.key}
                          direction={playerSortDir}
                        />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {playerRows.map((row) => (
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
                    <td className="league-standings-table__num">{row.matches}</td>
                    <td className="league-standings-table__num">{row.wins}</td>
                    <td className="league-standings-table__num">{row.losses}</td>
                    <td className="league-standings-table__num">
                      {formatWinPercent(row.winPercent)}
                    </td>
                    <td className="league-standings-table__num">
                      {formatAverageMetric(row.average, averageMetric)}
                    </td>
                    <td className="league-standings-table__num">{row.streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="league-players-table-wrap">
            <table className="league-players-table league-standings-table league-stats-table">
              <thead>
                <tr>
                  {(
                    [
                      { key: "rank", label: "Rank", className: "league-standings-table__rank" },
                      { key: "name", label: "Team", className: "league-standings-table__name" },
                      { key: "matches", label: "Matches", className: "league-standings-table__num" },
                      { key: "wins", label: "Wins", className: "league-standings-table__num" },
                      { key: "losses", label: "Losses", className: "league-standings-table__num" },
                      { key: "winPercent", label: "Win %", className: "league-standings-table__num" },
                      {
                        key: "legDiff",
                        label: "Leg Differential",
                        className: "league-standings-table__num",
                      },
                      { key: "streak", label: "Streak", className: "league-standings-table__num" },
                    ] as const
                  ).map((column) => (
                    <th key={column.key} className={column.className}>
                      <button
                        type="button"
                        className="league-stats-sort"
                        onClick={() => toggleTeamSort(column.key)}
                      >
                        <span>{column.label}</span>
                        <SortGlyph
                          active={teamSortKey === column.key}
                          direction={teamSortDir}
                        />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row) => (
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
                    <td className="league-standings-table__num">{row.matches}</td>
                    <td className="league-standings-table__num">{row.wins}</td>
                    <td className="league-standings-table__num">{row.losses}</td>
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
        )}
      </section>
    </div>
  );
}
