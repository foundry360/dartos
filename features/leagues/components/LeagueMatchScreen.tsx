"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LeagueMatchCard } from "@/features/leagues/components/LeagueMatchCard";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import "@/features/organizations/organizations-page.css";
import "@/features/leagues/league-detail.css";

export function LeagueMatchScreen() {
  const params = useParams<{ leagueId: string; matchId: string }>();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const matchId = typeof params.matchId === "string" ? params.matchId : "";

  const { schedule, loading: scheduleLoading, error } = useLeagueSchedule(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);

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
  const loading = scheduleLoading || playersLoading || teamsLoading;
  const matchesHref = `/leagues/league/${leagueId}?section=matches`;

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
                            : "Match ready"}
                      </p>
                      <p className="league-match-launch__sub">
                        Scoring for league matches will connect here next. Use
                        Back to Matches to return to the card list.
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
                      <Link
                        href={matchesHref}
                        className="league-btn league-btn--ghost-dark"
                      >
                        Back to Matches
                      </Link>
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
