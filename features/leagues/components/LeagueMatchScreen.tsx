"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  resolveMatchSideIdentity,
} from "@/features/leagues/components/LeagueMatchCard";
import { LeagueMatchStatusBadge } from "@/features/leagues/components/LeagueMatchStatusBadge";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  buildLeagueMatchPlaySetup,
  getLeagueMatchRulesSummary,
} from "@/features/leagues/lib/build-league-match-setup";
import { leagueEngineMatchId } from "@/features/leagues/lib/league-engine-match-id";
import {
  formatLeagueDate,
  formatLeagueGameFormatLabel,
  formatLeagueTime,
} from "@/features/leagues/lib/league-formats";
import { leagueMatchPlayHref } from "@/features/leagues/lib/league-match-play-href";
import {
  findMatchOccupyingBoard,
  formatBoardUnavailableCopy,
  formatDurationBetween,
  formatElapsed,
  type LeagueNightMatchControl,
  type LeagueNightMatchUiStatus,
} from "@/features/leagues/lib/league-night";
import {
  applyNightResultsToPlayers,
  applyNightResultsToTeams,
  emptyNightResults,
  readLeagueNightResults,
} from "@/features/leagues/lib/league-night-results";
import { readLeagueNightState } from "@/features/leagues/lib/league-night-storage";
import { isTerminalLeagueMatchStatus } from "@/features/leagues/lib/league-schedule";
import {
  averageMetricLabel,
  buildPlayerStatistics,
  buildTeamStatistics,
  formatAverageMetric,
  formatWinPercent,
  resolveAverageMetric,
  type LeaguePlayerStatRow,
  type LeagueTeamStatRow,
} from "@/features/leagues/lib/league-statistics";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { getX01SideLegsWon } from "@/features/x01/lib/x01-engine";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { useX01Store } from "@/features/x01/store/x01-store";
import { prepareMatchVoiceAsync } from "@/features/voice/lib/prepare-match-voice";
import { enterMatchFullscreen } from "@/utils/fullscreen";
import { cn } from "@/utils/cn";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-detail.css";
import "@/features/leagues/league-night.css";

function statusTitle(
  scheduleStatus: string,
  uiStatus: string | undefined,
): string {
  if (uiStatus === "paused") {
    return "Match saved for later";
  }
  switch (scheduleStatus) {
    case "in_progress":
      return "Match in progress";
    case "completed":
      return "Match completed";
    case "forfeited":
      return "Match forfeited";
    case "walkover":
      return "Match walkover";
    case "cancelled":
      return "Match canceled";
    default:
      return "Match ready";
  }
}

function StatMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="league-match-page__stat">
      <span className="league-match-page__stat-label">{label}</span>
      <span className="league-match-page__stat-value">{value}</span>
    </div>
  );
}

type SideSeasonStats = {
  matches: number;
  wins: number;
  losses: number;
  winPercent: number;
  average: number | null;
  streak: string;
};

function emptySideSeasonStats(): SideSeasonStats {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    winPercent: 0,
    average: null,
    streak: "—",
  };
}

function sideStatsFromPlayer(
  row: LeaguePlayerStatRow | undefined,
): SideSeasonStats {
  if (!row) {
    return emptySideSeasonStats();
  }
  return {
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    winPercent: row.winPercent,
    average: row.average,
    streak: row.streak,
  };
}

function sideStatsFromTeam(row: LeagueTeamStatRow | undefined): SideSeasonStats {
  if (!row) {
    return emptySideSeasonStats();
  }
  return {
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    winPercent: row.winPercent,
    average: null,
    streak: row.streak,
  };
}

export function LeagueMatchScreen() {
  const params = useParams<{ leagueId: string; matchId: string }>();
  const router = useRouter();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const matchId =
    typeof params.matchId === "string"
      ? decodeURIComponent(params.matchId)
      : "";

  const { league: leagueEntry, loading: leagueLoading } = useLeagueDetail(leagueId);
  const {
    schedule,
    loading: scheduleLoading,
    error,
    setMatchStatus,
    saving,
  } = useLeagueSchedule(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);
  const startX01 = useX01Store((state) => state.startGame);
  const startCricket = useCricketStore((state) => state.startGame);
  const activeX01Game = useX01Store((state) => state.game);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [nightResults, setNightResults] = useState(emptyNightResults);

  useEffect(() => {
    setNightResults(readLeagueNightResults(leagueId));
  }, [leagueId]);

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const isSingles = (leagueEntry?.league.format || "").toLowerCase() === "singles";
  const schedulePublished = schedule?.status === "published";
  const averageMetric = resolveAverageMetric(leagueEntry?.league.game_format);
  const averageLabel = averageMetricLabel(averageMetric);

  const playersWithResults = useMemo(
    () => applyNightResultsToPlayers(players, nightResults),
    [players, nightResults],
  );
  const teamsWithResults = useMemo(
    () => applyNightResultsToTeams(teams, nightResults),
    [teams, nightResults],
  );
  const playerStatsById = useMemo(() => {
    const rows = buildPlayerStatistics(playersWithResults);
    return new Map(rows.map((row) => [row.id, row]));
  }, [playersWithResults]);
  const teamStatsById = useMemo(() => {
    const rows = buildTeamStatistics(teamsWithResults);
    return new Map(rows.map((row) => [row.id, row]));
  }, [teamsWithResults]);

  const night = useLeagueNight({
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished,
    boardCount: leagueEntry?.organization.board_count,
  });

  const matchIndex = useMemo(() => {
    if (!schedule) {
      return -1;
    }
    return schedule.matches.findIndex((entry) => entry.key === matchId);
  }, [matchId, schedule]);

  const match = matchIndex >= 0 ? schedule?.matches[matchIndex] ?? null : null;
  const weekMatches = useMemo(() => {
    if (!schedule || !match) {
      return [];
    }
    return schedule.matches
      .filter((entry) => entry.weekNumber === match.weekNumber)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [match, schedule]);
  const weekMatchNumber = useMemo(() => {
    if (!match) {
      return matchIndex + 1;
    }
    const index = weekMatches.findIndex((entry) => entry.key === match.key);
    return index >= 0 ? index + 1 : matchIndex + 1;
  }, [match, matchIndex, weekMatches]);

  const loading =
    leagueLoading || scheduleLoading || playersLoading || teamsLoading;
  const matchesHref = `/leagues/league/${leagueId}?section=matches`;
  const nightHref = `/leagues/league/${leagueId}?section=night`;
  const rulesHref = `/leagues/league/${leagueId}?section=rules`;

  const rulesSummary = useMemo(() => {
    if (!leagueEntry) {
      return null;
    }
    return getLeagueMatchRulesSummary(leagueEntry.league);
  }, [leagueEntry]);

  const control: LeagueNightMatchControl | null = useMemo(() => {
    if (!match) {
      return null;
    }
    if (night.weekNumber === match.weekNumber) {
      return night.weekState?.matchControls[match.key] ?? null;
    }
    const persisted = readLeagueNightState(leagueId);
    return persisted.weeks[String(match.weekNumber)]?.matchControls[match.key] ?? null;
  }, [leagueId, match, night.weekNumber, night.weekState]);

  const uiStatus: LeagueNightMatchUiStatus = match
    ? night.getMatchStatus(match)
    : "waiting";

  const engineMatchId = match
    ? leagueEngineMatchId(leagueId, match.key)
    : null;
  const linkedX01Game =
    activeX01Game != null &&
    engineMatchId != null &&
    activeX01Game.matchId === engineMatchId
      ? activeX01Game
      : null;

  const homeScore =
    linkedX01Game != null
      ? getX01SideLegsWon(
          linkedX01Game.players,
          0,
          linkedX01Game.teamsEnabled,
        )
      : (control?.homeScore ?? 0);
  const awayScore =
    linkedX01Game != null
      ? getX01SideLegsWon(
          linkedX01Game.players,
          1,
          linkedX01Game.teamsEnabled,
        )
      : (control?.awayScore ?? 0);
  const winnerSide =
    control?.winnerSide ??
    (isTerminalLeagueMatchStatus(match?.status) && homeScore !== awayScore
      ? homeScore > awayScore
        ? "home"
        : "away"
      : null);

  const progressUnit =
    (leagueEntry?.league.game_format || "").toLowerCase() === "cricket" ||
    (leagueEntry?.league.game_format || "").toLowerCase() === "tactics"
      ? "game"
      : "leg";

  const elapsedLabel = control?.completedAt
    ? formatDurationBetween(control.startedAt, control.completedAt)
    : formatElapsed(control?.startedAt ?? null, night.now);

  const x01Stats = useMemo(
    () => (linkedX01Game ? computeX01MatchStatsFromGame(linkedX01Game) : null),
    [linkedX01Game],
  );

  const homeIdentity = match
    ? resolveMatchSideIdentity(
        match.homeId,
        match.homeKind,
        match.homeLabel,
        playersById,
        teamsById,
      )
    : null;
  const awayIdentity = match
    ? resolveMatchSideIdentity(
        match.awayId,
        match.awayKind,
        match.awayLabel,
        playersById,
        teamsById,
      )
    : null;

  const homeSeasonStats = useMemo(() => {
    if (!match?.homeId) {
      return emptySideSeasonStats();
    }
    if (match.homeKind === "player") {
      return sideStatsFromPlayer(playerStatsById.get(match.homeId));
    }
    return sideStatsFromTeam(teamStatsById.get(match.homeId));
  }, [match, playerStatsById, teamStatsById]);

  const awaySeasonStats = useMemo(() => {
    if (!match?.awayId) {
      return emptySideSeasonStats();
    }
    if (match.awayKind === "player") {
      return sideStatsFromPlayer(playerStatsById.get(match.awayId));
    }
    return sideStatsFromTeam(teamStatsById.get(match.awayId));
  }, [match, playerStatsById, teamStatsById]);

  const scheduledDate = match
    ? formatLeagueDate(match.scheduledAt) ?? "—"
    : "—";
  const scheduledTime = match
    ? formatLeagueTime(match.scheduledAt) ?? "—"
    : "—";
  const gameFormatLabel = leagueEntry
    ? formatLeagueGameFormatLabel(leagueEntry.league.game_format) ||
      leagueEntry.league.game_format?.toUpperCase() ||
      "—"
    : "—";

  const beginScoring = async () => {
    if (!leagueEntry || !match || starting || saving) {
      return;
    }

    setStartError(null);

    const board = control?.board ?? null;
    if (board != null && night.weekState) {
      const occupant = findMatchOccupyingBoard({
        matches: night.matches,
        matchControls: night.weekState.matchControls,
        board,
        excludeMatchKey: match.key,
      });
      if (occupant) {
        const copy = formatBoardUnavailableCopy({ board, occupant });
        setStartError(
          `${copy.boardLabel} ${copy.lead} ${copy.matchLabel} ${copy.status} ${copy.guidance}`,
        );
        return;
      }
    }

    const built = buildLeagueMatchPlaySetup({
      league: leagueEntry.league,
      match,
      playersById,
      teamsById,
      homePlayerIds: control?.homePlayerIds,
      awayPlayerIds: control?.awayPlayerIds,
    });

    if ("error" in built) {
      setStartError(built.error);
      return;
    }

    setStarting(true);

    try {
      if (match.status === "scheduled") {
        await setMatchStatus({ matchKey: match.key, status: "in_progress" });
      }

      await prepareMatchVoiceAsync();

      if (built.setup.kind === "x01") {
        const nextEngineMatchId = leagueEngineMatchId(leagueId, match.key);
        const canResume =
          activeX01Game != null &&
          activeX01Game.matchId === nextEngineMatchId &&
          (activeX01Game.status === "playing" ||
            activeX01Game.status === "finished");

        if (!canResume) {
          startX01({
            ...built.setup.setup,
            matchId: nextEngineMatchId,
          });
        }
      } else {
        startCricket(built.setup.setup);
      }

      await enterMatchFullscreen();

      router.push(
        leagueMatchPlayHref({
          leagueId,
          matchKey: match.key,
          setupKind: built.setup.kind,
          leagueFormat: leagueEntry.league.format,
          fallbackPlayHref: built.setup.playHref,
        }),
      );
    } catch (caught) {
      console.error("Failed to start league match play", caught);
      setStartError(
        caught instanceof Error
          ? caught.message
          : "Unable to start match play.",
      );
    } finally {
      setStarting(false);
    }
  };

  const canScore =
    match != null && !isTerminalLeagueMatchStatus(match.status);

  const detailRows = match
    ? [
        { label: "Week", value: `Week ${match.weekNumber}` },
        {
          label: "Match",
          value: `${weekMatchNumber} of ${weekMatches.length || 1}`,
        },
        { label: "Date", value: scheduledDate },
        { label: "Time", value: scheduledTime },
        {
          label: "Board",
          value: control?.board != null ? `Board ${control.board}` : "Unassigned",
        },
        { label: "Format", value: gameFormatLabel },
        {
          label: progressUnit === "game" ? "Current game" : "Current leg",
          value: String(
            linkedX01Game
              ? homeScore + awayScore + (linkedX01Game.status === "finished" ? 0 : 1)
              : (control?.currentLeg ?? homeScore + awayScore + 1),
          ),
        },
        { label: "Elapsed", value: elapsedLabel },
        {
          label: "Score",
          value: `${homeScore}–${awayScore}`,
        },
      ]
    : [];

  return (
    <MobileAppShell
      title="Match"
      className="organizations-page league-detail-page shell-page"
    >
      <div className="league-detail-screen">
        <header className="league-detail-header">
          <nav className="league-detail-header__breadcrumb" aria-label="Breadcrumb">
            <Link href="/leagues" className="league-detail-header__crumb">
              League Management
            </Link>
            <span className="league-detail-header__crumb-sep">/</span>
            <Link
              href={`/leagues/league/${leagueId}`}
              className="league-detail-header__crumb"
            >
              League
            </Link>
            <span className="league-detail-header__crumb-sep">/</span>
            <Link href={matchesHref} className="league-detail-header__crumb">
              Matches
            </Link>
            <span className="league-detail-header__crumb-sep">/</span>
            <span className="league-detail-header__crumb-current">
              {matchIndex >= 0 ? `Match #${weekMatchNumber}` : "Match"}
            </span>
          </nav>
        </header>

        <div className="league-detail-body">
          <div className="league-players-admin league-match-page">
            {loading ? (
              <section className="league-detail-card">
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Loading match…</p>
                </div>
              </section>
            ) : error ? (
              <section className="league-detail-card">
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Unable to load match</p>
                  <p className="league-empty__sub">{error}</p>
                </div>
              </section>
            ) : !match || !homeIdentity || !awayIdentity ? (
              <section className="league-detail-card">
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Match not found</p>
                  <p className="league-empty__sub">
                    This match may have been removed from the schedule.
                  </p>
                  <Link href={matchesHref} className="league-btn league-btn--primary">
                    Back to Matches
                  </Link>
                </div>
              </section>
            ) : (
              <>
                <section className="league-detail-card league-match-page__hero">
                  <div className="league-match-page__hero-top">
                    <div>
                      <p className="league-match-page__eyebrow">
                        Week {match.weekNumber} · Match {weekMatchNumber} of{" "}
                        {weekMatches.length || 1}
                      </p>
                      <h2 className="league-match-page__title">
                        {statusTitle(match.status, uiStatus)}
                      </h2>
                    </div>
                    <LeagueMatchStatusBadge status={uiStatus} />
                  </div>

                  <div className="league-match-page__scoreboard" aria-label="Match score">
                    <article
                      className={cn(
                        "league-match-page__player-card",
                        winnerSide === "home" && "is-winner",
                        winnerSide === "away" && "is-loser",
                      )}
                    >
                      <span className="league-match-page__side-label">Home</span>
                      <PlayerAvatar
                        name={homeIdentity.name}
                        color={homeIdentity.color}
                        avatarUrl={homeIdentity.avatarUrl}
                      />
                      <div className="league-match-page__player-card-copy">
                        <span className="league-match-page__side-name">
                          {homeIdentity.label}
                        </span>
                        {homeIdentity.label !== homeIdentity.name ? (
                          <span className="league-match-page__side-fullname">
                            {homeIdentity.name}
                          </span>
                        ) : null}
                      </div>
                      <div className="league-match-page__player-card-games">
                        <span className="league-match-page__side-score">{homeScore}</span>
                        <span className="league-match-page__games-label">
                          {progressUnit === "game" ? "Games" : "Legs"}
                        </span>
                      </div>
                    </article>

                    <div className="league-match-page__score-divider" aria-hidden>
                      <span>vs</span>
                      <strong>
                        {homeScore}–{awayScore}
                      </strong>
                    </div>

                    <article
                      className={cn(
                        "league-match-page__player-card",
                        winnerSide === "away" && "is-winner",
                        winnerSide === "home" && "is-loser",
                      )}
                    >
                      <span className="league-match-page__side-label">Away</span>
                      <PlayerAvatar
                        name={awayIdentity.name}
                        color={awayIdentity.color}
                        avatarUrl={awayIdentity.avatarUrl}
                      />
                      <div className="league-match-page__player-card-copy">
                        <span className="league-match-page__side-name">
                          {awayIdentity.label}
                        </span>
                        {awayIdentity.label !== awayIdentity.name ? (
                          <span className="league-match-page__side-fullname">
                            {awayIdentity.name}
                          </span>
                        ) : null}
                      </div>
                      <div className="league-match-page__player-card-games">
                        <span className="league-match-page__side-score">{awayScore}</span>
                        <span className="league-match-page__games-label">
                          {progressUnit === "game" ? "Games" : "Legs"}
                        </span>
                      </div>
                    </article>
                  </div>

                  {startError ? (
                    <p className="league-rules__error" role="alert">
                      {startError}
                    </p>
                  ) : null}

                  <div className="league-match-page__actions">
                    {canScore ? (
                      <button
                        type="button"
                        className="league-btn league-btn--primary"
                        disabled={starting || saving || !rulesSummary}
                        onClick={() => void beginScoring()}
                      >
                        {starting
                          ? "Starting…"
                          : match.status === "in_progress" ||
                              uiStatus === "live" ||
                              uiStatus === "paused"
                            ? "Resume Scoring"
                            : "Begin Scoring"}
                      </button>
                    ) : null}
                    <Link
                      href={nightHref}
                      className="league-btn league-btn--ghost-dark"
                    >
                      League Night
                    </Link>
                    <Link
                      href={matchesHref}
                      className="league-btn league-btn--ghost-dark"
                    >
                      All Matches
                    </Link>
                  </div>
                </section>

                <section className="league-detail-card league-match-page__stats-section">
                  <div className="league-detail-card__header">
                    <h3 className="league-detail-card__title">Match stats</h3>
                  </div>
                  <div className="league-players-table-wrap">
                    <table className="league-players-table league-standings-table league-stats-table">
                      <thead>
                        <tr>
                          <th className="league-standings-table__name">Player</th>
                          <th className="league-standings-table__num">Matches</th>
                          <th className="league-standings-table__num">Wins</th>
                          <th className="league-standings-table__num">Losses</th>
                          <th className="league-standings-table__num">Win %</th>
                          <th className="league-standings-table__num">{averageLabel}</th>
                          <th className="league-standings-table__num">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            {
                              key: "home",
                              identity: homeIdentity,
                              stats: homeSeasonStats,
                            },
                            {
                              key: "away",
                              identity: awayIdentity,
                              stats: awaySeasonStats,
                            },
                          ] as const
                        ).map((row) => (
                          <tr key={row.key}>
                            <td className="league-standings-table__name">
                              <div className="league-players-table__player">
                                <PlayerAvatar
                                  name={row.identity.name}
                                  color={row.identity.color}
                                  avatarUrl={row.identity.avatarUrl}
                                  size="sm"
                                />
                                <p className="league-players-table__name">
                                  {row.identity.label}
                                </p>
                              </div>
                            </td>
                            <td className="league-standings-table__num">
                              {row.stats.matches}
                            </td>
                            <td className="league-standings-table__num">
                              {row.stats.wins}
                            </td>
                            <td className="league-standings-table__num">
                              {row.stats.losses}
                            </td>
                            <td className="league-standings-table__num">
                              {formatWinPercent(row.stats.winPercent)}
                            </td>
                            <td className="league-standings-table__num">
                              {formatAverageMetric(
                                row.stats.average,
                                averageMetric,
                              )}
                            </td>
                            <td className="league-standings-table__num">
                              {row.stats.streak}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {linkedX01Game && x01Stats ? (
                    <>
                      <div className="league-detail-card__header league-match-page__session-header">
                        <h3 className="league-detail-card__title">Session stats</h3>
                      </div>
                      <div className="league-match-page__stats-grid">
                        {linkedX01Game.players.map((player, index) => {
                          const stats = x01Stats[index];
                          if (!stats) {
                            return null;
                          }
                          const sideLabel = index === 0 ? "Home" : "Away";
                          return (
                            <article
                              key={player.id}
                              className={cn(
                                "league-match-page__stats-card",
                                linkedX01Game.currentPlayerIndex === index &&
                                  linkedX01Game.status === "playing" &&
                                  "is-active",
                              )}
                            >
                              <header className="league-match-page__stats-head">
                                <PlayerAvatar
                                  name={player.name}
                                  color={player.color}
                                  avatarUrl={player.avatarUrl}
                                />
                                <div>
                                  <p className="league-match-page__stats-side">
                                    {sideLabel}
                                  </p>
                                  <h4 className="league-match-page__stats-name">
                                    {player.name}
                                  </h4>
                                </div>
                                <span className="league-match-page__stats-avg">
                                  {stats.threeDartAverage.toFixed(1)}
                                  <small>avg</small>
                                </span>
                              </header>
                              <div className="league-match-page__stats-metrics">
                                <StatMetric
                                  label="Remaining"
                                  value={String(player.remaining)}
                                />
                                <StatMetric
                                  label="Legs"
                                  value={String(player.legsWon)}
                                />
                                <StatMetric
                                  label="Darts"
                                  value={String(stats.dartsThrown)}
                                />
                                <StatMetric
                                  label="Visits"
                                  value={String(stats.visitCount)}
                                />
                                <StatMetric
                                  label="3x / 2x"
                                  value={`${stats.triples} / ${stats.doubles}`}
                                />
                                <StatMetric
                                  label="Misses"
                                  value={String(stats.misses)}
                                />
                                <StatMetric
                                  label="Busts"
                                  value={String(stats.busts)}
                                />
                                <StatMetric
                                  label="Checkouts"
                                  value={String(stats.checkoutSuccesses)}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </section>

                <div className="league-match-page__grid">
                  <section className="league-detail-card">
                    <div className="league-detail-card__header">
                      <h3 className="league-detail-card__title">Match details</h3>
                    </div>
                    <dl className="league-info league-match-page__details">
                      {detailRows.map((row) => (
                        <div key={row.label} className="league-info__row">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section className="league-detail-card">
                    <div className="league-detail-card__header">
                      <h3 className="league-detail-card__title">Game rules</h3>
                    </div>
                    {rulesSummary ? (
                      <dl className="league-info">
                        {rulesSummary.map((row) => (
                          <div key={row.label} className="league-info__row">
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="league-match-launch__sub">
                        No Game Rules saved yet.{" "}
                        <Link href={rulesHref} className="league-link">
                          Set Game Rules
                        </Link>{" "}
                        before scoring.
                      </p>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}
