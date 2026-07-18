"use client";

import { useMemo, useState } from "react";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  EndLeagueMatchModal,
  type EndMatchResult,
} from "@/features/leagues/components/EndLeagueMatchModal";
import { LeagueMatchCard } from "@/features/leagues/components/LeagueMatchCard";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { getLeagueMatchRulesSummary } from "@/features/leagues/lib/build-league-match-setup";
import {
  awardedMatchScoreline,
  getLeagueMatchUnitsToWin,
} from "@/features/leagues/lib/league-match-award-score";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import type {
  DraftLeagueMatch,
  LeagueScheduleModel,
} from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { leagueEngineMatchId } from "@/features/leagues/lib/league-engine-match-id";
import { useX01Store } from "@/features/x01/store/x01-store";
import type { LeagueRow } from "@/lib/supabase/database.types";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-detail.css";

interface LeagueMatchDeskPanelProps {
  open: boolean;
  onClose: () => void;
  leagueId: string;
  league: Pick<LeagueRow, "game_format" | "rules" | "format"> | null;
  match: DraftLeagueMatch | null;
  matchNumber: number;
  schedule: LeagueScheduleModel | null;
  players: LeaguePlayer[];
  teams: LeagueTeam[];
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  onResumeScoring: () => void;
  /** End match / leave scoring — parent suppresses bounce to Match page. */
  onLeaveToLeagueNight: () => void;
}

function statusTitle(
  scheduleStatus: DraftLeagueMatch["status"],
  uiStatus: string | undefined,
): string {
  if (uiStatus === "paused") {
    return "Match paused";
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

export function LeagueMatchDeskPanel({
  open,
  onClose,
  leagueId,
  league,
  match,
  matchNumber,
  schedule,
  players,
  teams,
  playersById,
  teamsById,
  onResumeScoring,
  onLeaveToLeagueNight,
}: LeagueMatchDeskPanelProps) {
  const { setMatchStatus, saving } = useLeagueSchedule(leagueId);
  const activeX01Game = useX01Store((state) => state.game);
  const [endOpen, setEndOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSingles = (league?.format || "").toLowerCase() === "singles";
  const schedulePublished = schedule?.status === "published";

  const night = useLeagueNight({
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished,
  });

  const uiStatus = match
    ? night.weekState?.matchControls[match.key]?.uiStatus
    : undefined;
  const isPaused = uiStatus === "paused";
  const rulesSummary = useMemo(
    () => (league ? getLeagueMatchRulesSummary(league) : null),
    [league],
  );

  const boardActivityTitle = (action: string) => {
    if (!match) {
      return `Match ${action}`;
    }
    const board = night.weekState?.matchControls[match.key]?.board;
    return board != null ? `Board ${board} Match ${action}` : `Match ${action}`;
  };

  const handlePauseToggle = () => {
    if (!match) {
      return;
    }
    if (isPaused) {
      night.setMatchControlStatus(match.key, "live", {
        activityTitle: boardActivityTitle("Resumed"),
      });
      return;
    }
    night.setMatchControlStatus(match.key, "paused", {
      activityTitle: boardActivityTitle("Paused"),
    });
  };

  const handleEndMatch = async (result: EndMatchResult) => {
    if (!match || ending || saving) {
      return;
    }

    setEnding(true);
    setError(null);

    try {
      switch (result.reason) {
        case "cancel": {
          await setMatchStatus({ matchKey: match.key, status: "cancelled" });
          night.setMatchControlStatus(match.key, "cancelled", {
            winnerSide: null,
            homeScore: 0,
            awayScore: 0,
            activityTitle: boardActivityTitle("Cancelled"),
          });
          break;
        }
        case "award_win":
        case "forfeit":
        case "walkover": {
          const winnerSide = result.winnerSide;
          if (!winnerSide) {
            throw new Error("Select a winner to end this match.");
          }
          const winnerLabel =
            winnerSide === "home" ? match.homeLabel : match.awayLabel;
          const loserLabel =
            winnerSide === "home" ? match.awayLabel : match.homeLabel;
          const activityTitle =
            result.reason === "forfeit"
              ? `${winnerLabel} wins by forfeit over ${loserLabel}`
              : result.reason === "walkover"
                ? `${winnerLabel} wins by walkover over ${loserLabel}`
                : `${winnerLabel} defeated ${loserLabel}`;
          const scheduleStatus =
            result.reason === "award_win"
              ? "completed"
              : result.reason === "walkover"
                ? "walkover"
                : "forfeited";
          await setMatchStatus({
            matchKey: match.key,
            status: scheduleStatus,
          });
          const nextUiStatus =
            result.reason === "award_win"
              ? "completed"
              : result.reason === "walkover"
                ? "walkover"
                : "forfeited";

          const control = night.weekState?.matchControls[match.key];
          const engineMatchId = leagueEngineMatchId(leagueId, match.key);
          const liveHomeLegs =
            activeX01Game?.matchId === engineMatchId
              ? (activeX01Game.players[0]?.legsWon ?? 0)
              : undefined;
          const liveAwayLegs =
            activeX01Game?.matchId === engineMatchId
              ? (activeX01Game.players[1]?.legsWon ?? 0)
              : undefined;
          const unitsToWin = league
            ? getLeagueMatchUnitsToWin(league)
            : Math.max(1, activeX01Game?.legsToWin ?? 1);
          const { homeScore, awayScore } = awardedMatchScoreline({
            winnerSide,
            unitsToWin,
            currentHomeScore: liveHomeLegs ?? control?.homeScore ?? 0,
            currentAwayScore: liveAwayLegs ?? control?.awayScore ?? 0,
          });

          night.setMatchControlStatus(match.key, nextUiStatus, {
            winnerSide,
            homeScore,
            awayScore,
            activityTitle,
          });
          break;
        }
        default: {
          const _exhaustive: never = result.reason;
          throw new Error(`Unhandled end reason: ${_exhaustive}`);
        }
      }

      setEndOpen(false);
      onLeaveToLeagueNight();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to end match.",
      );
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      <SlidePanel
        open={open}
        title="Match Desk"
        onClose={onClose}
        side="left"
        className="league-match-desk-panel league-slide-drawer"
      >
        {match ? (
          <div className="league-slide-drawer__layout">
            <div className="league-slide-drawer__scroll">
              <LeagueMatchCard
                matchNumber={matchNumber}
                match={match}
                homeScore={
                  night.weekState?.matchControls[match.key]?.homeScore
                }
                awayScore={
                  night.weekState?.matchControls[match.key]?.awayScore
                }
                winnerSide={
                  night.weekState?.matchControls[match.key]?.winnerSide ?? null
                }
                status={uiStatus}
                playersById={playersById}
                teamsById={teamsById}
              />

              <div className="league-match-launch__copy">
                <p className="league-match-launch__title">
                  {statusTitle(match.status, uiStatus)}
                </p>
                <p className="league-match-launch__sub">
                  Continue scoring, pause the board session, or end the match
                  without a full scoreline.
                </p>

                {rulesSummary ? (
                  <dl className="league-info league-match-launch__rules">
                    {rulesSummary.map((row) => (
                      <div key={row.label} className="league-info__row">
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {error ? (
                  <p className="league-rules__error" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                "league-slide-drawer__actions",
                "league-match-desk-panel__actions",
              )}
            >
              <TouchButton
                type="button"
                variant="primary"
                onClick={onResumeScoring}
              >
                Continue Scoring
              </TouchButton>
              <TouchButton
                type="button"
                variant="secondary"
                onClick={handlePauseToggle}
              >
                {isPaused ? "Resume" : "Pause"}
              </TouchButton>
              <TouchButton
                type="button"
                variant="secondary"
                disabled={ending || saving}
                onClick={() => setEndOpen(true)}
              >
                End Match
              </TouchButton>
            </div>
          </div>
        ) : (
          <p className="league-match-launch__sub">Match details unavailable.</p>
        )}
      </SlidePanel>

      <EndLeagueMatchModal
        open={endOpen && Boolean(match)}
        matchNumber={matchNumber}
        matchLabel={
          match ? `${match.homeLabel} vs ${match.awayLabel}` : "this match"
        }
        homeLabel={match?.homeLabel ?? "Home"}
        awayLabel={match?.awayLabel ?? "Away"}
        busy={ending}
        onClose={() => setEndOpen(false)}
        onConfirm={(result) => {
          void handleEndMatch(result);
        }}
      />
    </>
  );
}
