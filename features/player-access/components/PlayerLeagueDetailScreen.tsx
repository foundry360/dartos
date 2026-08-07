"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { LeagueStatusBadge } from "@/features/leagues/components/LeaguePlayerStatus";
import { ScheduleMatchList } from "@/features/leagues/components/ScheduleMatchList";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  formatLeagueDate,
  formatLeagueFormatDetailLabel,
  formatLeagueGameFormatLabel,
  formatLeagueTime,
  formatLeagueWeekday,
  formatPlayerLeagueStatusLabel,
  getPlayerLeagueStatus,
} from "@/features/leagues/lib/league-formats";
import {
  formatLeagueRulesSummaryRows,
  normalizeLeagueRules,
} from "@/features/leagues/lib/league-game-rules";
import {
  applyNightResultsToPlayers,
  applyNightResultsToTeams,
  buildResultsFromMatches,
} from "@/features/leagues/lib/league-night-results";
import {
  leaguePlayerDisplayName,
  LEAGUE_PLAYER_STATUS_LABEL,
} from "@/features/leagues/lib/league-players";
import {
  groupMatchesByWeek,
  participantsFromLeague,
} from "@/features/leagues/lib/league-schedule";
import {
  buildSinglesStandings,
  buildTeamStandings,
  formatLegDiff,
  formatWinPercent,
} from "@/features/leagues/lib/league-standings";
import {
  averageMetricLabel,
  buildPlayerStatistics,
  buildTeamStatistics,
  formatAverageMetric,
  resolveAverageMetric,
} from "@/features/leagues/lib/league-statistics";
import {
  LEAGUE_DISCOVER_PATH,
  LEAGUE_PLAY_PATH,
  PLAYER_DISCOVER_PATH,
  PLAYER_MY_LEAGUES_PATH,
} from "@/lib/auth/routes";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";
import { isPhoneLayoutDevice } from "@/utils/fullscreen";
import "@/features/player-access/player-access.css";
import "@/features/leagues/league-play.css";
import "@/features/leagues/league-schedule.css";

type DetailTab =
  | "standings"
  | "schedule"
  | "results"
  | "stats"
  | "roster"
  | "details";

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "standings", label: "Standings" },
  { id: "schedule", label: "Schedule" },
  { id: "results", label: "Results" },
  { id: "stats", label: "Stats" },
  { id: "roster", label: "Roster" },
  { id: "details", label: "League Details" },
];

interface PlayerLeagueDetailScreenProps {
  leagueId: string;
  /** Free player app shell vs Club/Elite member shell. */
  variant?: "player" | "member";
}

export function PlayerLeagueDetailScreen({
  leagueId,
  variant = "player",
}: PlayerLeagueDetailScreenProps) {
  const searchParams = useSearchParams();
  const fromDiscover = searchParams.get("from") === "discover";
  const { user } = useAuth();
  const [tab, setTab] = useState<DetailTab>("standings");
  const [isIPhone, setIsIPhone] = useState(false);

  const { league: leagueEntry, loading: leagueLoading, error: leagueError } =
    useLeagueDetail(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);
  const { schedule, loading: scheduleLoading } = useLeagueSchedule(leagueId);

  useEffect(() => {
    setIsIPhone(isPhoneLayoutDevice());
  }, []);

  const league = leagueEntry?.league ?? null;
  const organization = leagueEntry?.organization ?? null;
  const isSingles = (league?.competition_format ?? "singles") !== "teams";
  const averageMetric = resolveAverageMetric(league?.game_format);

  const nightResults = useMemo(
    () => buildResultsFromMatches(schedule?.matches ?? []),
    [schedule?.matches],
  );

  const scoredPlayers = useMemo(
    () => applyNightResultsToPlayers(players, nightResults),
    [players, nightResults],
  );
  const scoredTeams = useMemo(
    () => applyNightResultsToTeams(teams, nightResults),
    [teams, nightResults],
  );

  const standingRows = useMemo(() => {
    if (isSingles) {
      return buildSinglesStandings(scoredPlayers);
    }
    return buildTeamStandings(scoredTeams);
  }, [isSingles, scoredPlayers, scoredTeams]);

  const playerStats = useMemo(
    () => buildPlayerStatistics(scoredPlayers),
    [scoredPlayers],
  );
  const teamStats = useMemo(
    () => buildTeamStatistics(scoredTeams),
    [scoredTeams],
  );

  const completedMatches = useMemo(
    () =>
      (schedule?.matches ?? [])
        .filter(
          (match) =>
            match.status === "completed" ||
            match.status === "forfeited" ||
            match.status === "walkover",
        )
        .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    [schedule?.matches],
  );

  const participants = useMemo(
    () =>
      participantsFromLeague({
        leagueType: league?.competition_format,
        teams,
        players,
      }),
    [league?.competition_format, teams, players],
  );

  const weeks = useMemo(
    () => groupMatchesByWeek(schedule?.matches ?? [], participants),
    [schedule?.matches, participants],
  );

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const rosterPlayers = useMemo(
    () =>
      [...players]
        .filter((player) => player.leagueStatus !== "inactive")
        .sort((a, b) =>
          leaguePlayerDisplayName(a).localeCompare(
            leaguePlayerDisplayName(b),
            undefined,
            { sensitivity: "base" },
          ),
        ),
    [players],
  );

  const myMembershipStatus = useMemo(() => {
    if (!user?.id) {
      return null;
    }
    const mine = players.find((player) => player.profileUserId === user.id);
    return mine?.leagueStatus ?? null;
  }, [players, user?.id]);

  const rulesRows = useMemo(() => {
    if (!league) {
      return [];
    }
    const rules = normalizeLeagueRules(league.rules, league.game_format);
    if (!rules) {
      return [];
    }
    return formatLeagueRulesSummaryRows(
      rules,
      formatLeagueGameFormatLabel(league.game_format),
      league.competition_format,
    );
  }, [league]);

  const infoRows = useMemo(() => {
    if (!league) {
      return [];
    }
    const status = getPlayerLeagueStatus(league);
    const rows: Array<{ label: string; value: string }> = [
      {
        label: "Status",
        value: formatPlayerLeagueStatusLabel(status),
      },
      {
        label: "Venue",
        value: organization?.name?.trim() || "—",
      },
      {
        label: "Format",
        value:
          formatLeagueFormatDetailLabel(league.competition_format) ??
          formatLeagueGameFormatLabel(league.game_format) ??
          "—",
      },
      {
        label: "Game",
        value: formatLeagueGameFormatLabel(league.game_format) ?? "—",
      },
      {
        label: "Night",
        value: formatLeagueWeekday(league.starts_at) ?? "—",
      },
      {
        label: "Time",
        value: formatLeagueTime(league.starts_at) ?? "—",
      },
      {
        label: "Starts",
        value: formatLeagueDate(league.starts_at) ?? "—",
      },
      {
        label: "Ends",
        value: formatLeagueDate(league.ends_at) ?? "—",
      },
    ];
    return rows;
  }, [league, organization?.name]);

  const loading =
    leagueLoading || playersLoading || teamsLoading || scheduleLoading;
  const heading = league?.name ?? "League";

  const backHref =
    variant === "member"
      ? fromDiscover
        ? LEAGUE_DISCOVER_PATH
        : LEAGUE_PLAY_PATH
      : fromDiscover
        ? PLAYER_DISCOVER_PATH
        : PLAYER_MY_LEAGUES_PATH;

  const body = (
    <div className="league-play-screen player-league-detail">
      {variant === "member" ? (
        <nav className="player-league-detail__breadcrumb" aria-label="Breadcrumb">
          <Link href={backHref} className="player-league-detail__crumb">
            {fromDiscover ? "Discover" : "My Leagues"}
          </Link>
          <span className="player-league-detail__crumb-sep">/</span>
          <span className="player-league-detail__crumb-current">{heading}</span>
        </nav>
      ) : null}

      {leagueError ? (
        <p className="league-play-screen__empty">{leagueError}</p>
      ) : (
        <>
          <header className="player-league-detail__header">
            <div className="player-league-detail__header-top">
              <div className="player-league-detail__header-copy">
                {variant === "member" ? (
                  <h1 className="player-league-detail__title">{heading}</h1>
                ) : null}
                {organization?.name ? (
                  <p className="player-league-detail__subtitle">
                    {organization.name}
                  </p>
                ) : null}
              </div>
              {isIPhone && myMembershipStatus ? (
                <LeagueStatusBadge status={myMembershipStatus} />
              ) : null}
            </div>
          </header>

          {loading ? (
            <p className="league-play-screen__empty">Loading…</p>
          ) : (
            <>
              <div
                className="player-league-detail__tabs player-league-detail__tabs--scroll"
                role="tablist"
                aria-label="League sections"
              >
                {TABS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === entry.id}
                    className={cn(
                      "player-league-detail__tab",
                      tab === entry.id && "is-active",
                    )}
                    onClick={() => setTab(entry.id)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>

              {tab === "standings" ? (
                    standingRows.length === 0 ? (
                      <p className="league-play-screen__empty">No standings yet.</p>
                    ) : (
                      <div className="player-league-detail__table-wrap">
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
                      </div>
                    )
                  ) : tab === "schedule" ? (
                    !schedule || weeks.length === 0 ? (
                      <p className="league-play-screen__empty">
                        {schedule?.status === "draft"
                          ? "Schedule is still being prepared."
                          : "No schedule published yet."}
                      </p>
                    ) : (
                      <ScheduleMatchList
                        weeks={weeks}
                        playersById={playersById}
                        teamsById={teamsById}
                        participants={participants}
                        canReplaceSides={false}
                      />
                    )
                  ) : tab === "results" ? (
                    completedMatches.length === 0 ? (
                      <p className="league-play-screen__empty">
                        No completed matches yet.
                      </p>
                    ) : (
                      <div className="player-league-detail__stack">
                        {completedMatches.map((match) => (
                          <article
                            key={match.key}
                            className="player-league-detail__card player-league-detail__result"
                          >
                            <div className="player-league-detail__result-top">
                              <h2>
                                {match.homeLabel} vs {match.awayLabel}
                              </h2>
                              <span className="player-league-detail__result-score">
                                {match.homeScore ?? 0}–{match.awayScore ?? 0}
                              </span>
                            </div>
                            <p className="player-league-detail__result-meta">
                              {[
                                formatLeagueDate(match.scheduledAt),
                                match.status === "completed"
                                  ? null
                                  : match.status.charAt(0).toUpperCase() +
                                    match.status.slice(1),
                                match.winnerSide
                                  ? `${match.winnerSide === "home" ? match.homeLabel : match.awayLabel} wins`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </article>
                        ))}
                      </div>
                    )
                  ) : tab === "stats" ? (
                    isSingles ? (
                      playerStats.length === 0 ? (
                        <p className="league-play-screen__empty">No stats yet.</p>
                      ) : (
                        <div className="player-league-detail__table-wrap">
                          <table className="player-standings-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>M</th>
                                <th>W</th>
                                <th>L</th>
                                <th>Win%</th>
                                <th>{averageMetricLabel(averageMetric)}</th>
                                <th>Streak</th>
                              </tr>
                            </thead>
                            <tbody>
                              {playerStats.map((row) => (
                                <tr key={row.id}>
                                  <td>{row.rank}</td>
                                  <td>{row.name}</td>
                                  <td>{row.matches}</td>
                                  <td>{row.wins}</td>
                                  <td>{row.losses}</td>
                                  <td>{formatWinPercent(row.winPercent)}</td>
                                  <td>
                                    {formatAverageMetric(
                                      row.average,
                                      averageMetric,
                                    )}
                                  </td>
                                  <td>{row.streak}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : teamStats.length === 0 ? (
                      <p className="league-play-screen__empty">No stats yet.</p>
                    ) : (
                      <div className="player-league-detail__table-wrap">
                        <table className="player-standings-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Team</th>
                              <th>M</th>
                              <th>W</th>
                              <th>L</th>
                              <th>Win%</th>
                              <th>+/−</th>
                              <th>Streak</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamStats.map((row) => (
                              <tr key={row.id}>
                                <td>{row.rank}</td>
                                <td>{row.name}</td>
                                <td>{row.matches}</td>
                                <td>{row.wins}</td>
                                <td>{row.losses}</td>
                                <td>{formatWinPercent(row.winPercent)}</td>
                                <td>{formatLegDiff(row.legDiff)}</td>
                                <td>{row.streak}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : tab === "roster" ? (
                    rosterPlayers.length === 0 ? (
                      <p className="league-play-screen__empty">
                        No players on the roster yet.
                      </p>
                    ) : (
                      <ul className="player-league-detail__roster">
                        {rosterPlayers.map((player) => (
                          <li
                            key={player.id}
                            className="player-league-detail__roster-row"
                          >
                            <PlayerAvatar
                              name={leaguePlayerDisplayName(player)}
                              color={player.color || APP_PRIMARY_COLOR}
                              avatarUrl={player.avatarUrl}
                              size="sm"
                            />
                            <div className="player-league-detail__roster-copy">
                              <p className="player-league-detail__roster-name">
                                {leaguePlayerDisplayName(player)}
                              </p>
                              <p className="player-league-detail__roster-meta">
                                {[
                                  player.teamName ??
                                    (isSingles ? null : "Unassigned"),
                                  LEAGUE_PLAYER_STATUS_LABEL[player.leagueStatus],
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    <div className="player-league-detail__stack">
                      <section className="player-league-detail__card">
                        <h2 className="player-league-detail__card-title">
                          League Info
                        </h2>
                        <dl className="player-league-detail__meta">
                          {infoRows.map((row) => (
                            <div
                              key={row.label}
                              className="player-league-detail__meta-row"
                            >
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>

                      <section className="player-league-detail__card">
                        <h2 className="player-league-detail__card-title">Rules</h2>
                        {rulesRows.length === 0 ? (
                          <p className="league-play-screen__empty">
                            Rules not set yet.
                          </p>
                        ) : (
                          <dl className="player-league-detail__meta">
                            {rulesRows.map((row) => (
                              <div
                                key={row.label}
                                className="player-league-detail__meta-row"
                              >
                                <dt>{row.label}</dt>
                                <dd>{row.value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </section>
                    </div>
                  )}
            </>
          )}
        </>
      )}
    </div>
  );

  if (variant === "member") {
    return (
      <MobileAppShell className="shell-page league-play-page">
        {body}
      </MobileAppShell>
    );
  }

  return (
    <PlayerAppShell heading={heading} backHref={backHref} className="shell-page">
      {body}
    </PlayerAppShell>
  );
}
