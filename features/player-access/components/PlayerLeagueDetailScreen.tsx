"use client";

import { useMemo, useState } from "react";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
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
import { buildPlayerStatistics } from "@/features/leagues/lib/league-statistics";
import { PLAYER_HOME_PATH } from "@/lib/auth/routes";
import "@/features/player-access/player-access.css";
import "@/features/leagues/league-play.css";

type DetailTab = "standings" | "stats" | "results";

export function PlayerLeagueDetailScreen({ leagueId }: { leagueId: string }) {
  const [tab, setTab] = useState<DetailTab>("standings");
  const { league: leagueEntry, loading: leagueLoading, error: leagueError } =
    useLeagueDetail(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);
  const { schedule, loading: scheduleLoading } = useLeagueSchedule(leagueId);

  const league = leagueEntry?.league ?? null;
  const isSingles = (league?.competition_format ?? "singles") !== "teams";
  const nightResults = useMemo(
    () => buildResultsFromMatches(schedule?.matches ?? []),
    [schedule?.matches],
  );

  const standingRows = useMemo(() => {
    if (isSingles) {
      return buildSinglesStandings(applyNightResultsToPlayers(players, nightResults));
    }
    return buildTeamStandings(applyNightResultsToTeams(teams, nightResults));
  }, [isSingles, players, teams, nightResults]);

  const playerStats = useMemo(
    () => buildPlayerStatistics(applyNightResultsToPlayers(players, nightResults)),
    [players, nightResults],
  );

  const topWins = playerStats[0] ?? null;
  const bestStreak = useMemo(() => {
    return [...playerStats].sort((a, b) => b.wins - a.wins || b.winPercent - a.winPercent)[0] ?? null;
  }, [playerStats]);

  const completedMatches = useMemo(
    () =>
      (schedule?.matches ?? []).filter(
        (match) =>
          match.status === "completed" ||
          match.status === "forfeited" ||
          match.status === "walkover",
      ),
    [schedule?.matches],
  );

  const loading = leagueLoading || playersLoading || teamsLoading || scheduleLoading;
  const title = league?.name ?? "League";

  return (
    <PlayerAppShell title={title} backHref={PLAYER_HOME_PATH} className="shell-page">
      <div className="league-play-screen player-league-detail">
        {leagueError ? (
          <p className="league-play-screen__empty">{leagueError}</p>
        ) : (
          <>
            <p className="league-play-screen__empty" style={{ marginBottom: "1rem" }}>
              Standings, stats, and results for your league.
            </p>

            <div className="player-league-detail__tabs" role="tablist" aria-label="League sections">
              {(
                [
                  ["standings", "Standings"],
                  ["stats", "Stats"],
                  ["results", "Results"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={`player-league-detail__tab${tab === value ? " is-active" : ""}`}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="league-play-screen__empty">Loading…</p>
            ) : tab === "standings" ? (
              standingRows.length === 0 ? (
                <p className="league-play-screen__empty">No standings yet.</p>
              ) : (
                <table className="player-standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{isSingles ? "Player" : "Team"}</th>
                      <th>W</th>
                      <th>L</th>
                      <th>Pts</th>
                      <th>Win%</th>
                      <th>+/−</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standingRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.rank}</td>
                        <td>{row.name}</td>
                        <td>{row.wins}</td>
                        <td>{row.losses}</td>
                        <td>{row.points}</td>
                        <td>{formatWinPercent(row.winPercent)}</td>
                        <td>{formatLegDiff(row.legDiff)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : tab === "stats" ? (
              <div className="player-discover__list">
                <article className="player-discover__card">
                  <h2>Top wins</h2>
                  <p>
                    {topWins
                      ? `${topWins.name} · ${topWins.wins}W (${formatWinPercent(topWins.winPercent)})`
                      : "No match results yet."}
                  </p>
                </article>
                <article className="player-discover__card">
                  <h2>Form leader</h2>
                  <p>
                    {bestStreak
                      ? `${bestStreak.name} · streak ${bestStreak.streak}`
                      : "No streak data yet."}
                  </p>
                </article>
              </div>
            ) : completedMatches.length === 0 ? (
              <p className="league-play-screen__empty">No completed matches yet.</p>
            ) : (
              <div className="player-discover__list">
                {completedMatches.map((match) => (
                  <article key={match.key} className="player-discover__card">
                    <h2>
                      {match.homeLabel} vs {match.awayLabel}
                    </h2>
                    <p>
                      {match.homeScore ?? 0} – {match.awayScore ?? 0}
                      {match.winnerSide ? ` · ${match.winnerSide} wins` : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PlayerAppShell>
  );
}
