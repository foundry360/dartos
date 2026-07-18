"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TouchButton } from "@/components/ui/TouchButton";
import { LeagueMatchCard } from "@/features/leagues/components/LeagueMatchCard";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  buildLeagueMatchPlaySetup,
  getLeagueMatchRulesSummary,
} from "@/features/leagues/lib/build-league-match-setup";
import { leagueMatchPlayHref } from "@/features/leagues/lib/league-match-play-href";
import { leagueEngineMatchId } from "@/features/leagues/lib/league-engine-match-id";
import { isTerminalLeagueMatchStatus } from "@/features/leagues/lib/league-schedule";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";
import { prepareMatchVoiceAsync } from "@/features/voice/lib/prepare-match-voice";
import { enterMatchFullscreen } from "@/utils/fullscreen";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-detail.css";

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

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const matchIndex = useMemo(() => {
    if (!schedule) {
      return -1;
    }

    return schedule.matches.findIndex((entry) => entry.key === matchId);
  }, [matchId, schedule]);

  const match = matchIndex >= 0 ? schedule?.matches[matchIndex] ?? null : null;
  const loading =
    leagueLoading || scheduleLoading || playersLoading || teamsLoading;
  const matchesHref = `/leagues/league/${leagueId}?section=matches`;
  const rulesHref = `/leagues/league/${leagueId}?section=rules`;

  const rulesSummary = useMemo(() => {
    if (!leagueEntry) {
      return null;
    }
    return getLeagueMatchRulesSummary(leagueEntry.league);
  }, [leagueEntry]);

  const beginScoring = async () => {
    if (!leagueEntry || !match || starting || saving) {
      return;
    }

    setStartError(null);

    const built = buildLeagueMatchPlaySetup({
      league: leagueEntry.league,
      match,
      playersById,
      teamsById,
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
        const engineMatchId = leagueEngineMatchId(leagueId, match.key);
        const canResume =
          activeX01Game != null &&
          activeX01Game.matchId === engineMatchId &&
          (activeX01Game.status === "playing" ||
            activeX01Game.status === "finished");

        if (!canResume) {
          startX01({
            ...built.setup.setup,
            matchId: engineMatchId,
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
              {matchIndex >= 0 ? `Match #${matchIndex + 1}` : "Match"}
            </span>
          </nav>
        </header>

        <div className="league-detail-body">
          <div className="league-players-admin">
            <section className="league-detail-card">
              {loading ? (
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Loading match…</p>
                </div>
              ) : error ? (
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Unable to load match</p>
                  <p className="league-empty__sub">{error}</p>
                </div>
              ) : !match ? (
                <div className="league-empty league-empty--players">
                  <p className="league-empty__title">Match not found</p>
                  <p className="league-empty__sub">
                    This match may have been removed from the schedule.
                  </p>
                  <Link href={matchesHref} className="league-btn league-btn--primary">
                    Back to Matches
                  </Link>
                </div>
              ) : (
                <>
                  <div className="league-detail-card__header">
                    <h2 className="league-detail-card__title">
                      Match #{matchIndex + 1}
                    </h2>
                  </div>

                  <div className="league-match-launch">
                    <LeagueMatchCard
                      matchNumber={matchIndex + 1}
                      match={match}
                      playersById={playersById}
                      teamsById={teamsById}
                    />

                    <div className="league-match-launch__copy">
                      <p className="league-match-launch__title">
                        {match.status === "in_progress"
                          ? "Match in progress"
                          : match.status === "completed"
                            ? "Match completed"
                            : match.status === "forfeited"
                              ? "Match forfeited"
                              : match.status === "walkover"
                                ? "Match walkover"
                                : match.status === "cancelled"
                                  ? "Match canceled"
                                  : "Match ready"}
                      </p>
                      <p className="league-match-launch__sub">
                        Scoring uses this league’s Game Rules. Both sides are
                        loaded below.
                      </p>
                      <div className="league-match-launch__players">
                        <div className="league-match-launch__player">
                          <PlayerAvatar
                            name={match.homeLabel}
                            color={
                              playersById.get(match.homeId ?? "")?.color ||
                              teamsById.get(match.homeId ?? "")?.color ||
                              "#8B9B5C"
                            }
                            avatarUrl={
                              playersById.get(match.homeId ?? "")?.avatarUrl ??
                              null
                            }
                          />
                          <span>{match.homeLabel}</span>
                        </div>
                        <span className="league-match-launch__vs">vs</span>
                        <div className="league-match-launch__player">
                          <PlayerAvatar
                            name={match.awayLabel}
                            color={
                              playersById.get(match.awayId ?? "")?.color ||
                              teamsById.get(match.awayId ?? "")?.color ||
                              "#8B9B5C"
                            }
                            avatarUrl={
                              playersById.get(match.awayId ?? "")?.avatarUrl ??
                              null
                            }
                          />
                          <span>{match.awayLabel}</span>
                        </div>
                      </div>

                      {rulesSummary ? (
                        <dl className="league-info league-match-launch__rules">
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

                      {startError ? (
                        <p className="league-rules__error" role="alert">
                          {startError}
                        </p>
                      ) : null}

                      <div className="league-match-launch__actions">
                        {canScore ? (
                          <TouchButton
                            type="button"
                            variant="primary"
                            disabled={starting || saving || !rulesSummary}
                            onClick={() => void beginScoring()}
                          >
                            {starting
                              ? "Starting…"
                              : match.status === "in_progress"
                                ? "Resume Scoring"
                                : "Begin Scoring"}
                          </TouchButton>
                        ) : null}
                        <Link
                          href={matchesHref}
                          className="league-btn league-btn--ghost-dark"
                        >
                          Back to Matches
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
}
