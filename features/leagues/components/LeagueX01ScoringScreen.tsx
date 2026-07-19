"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { MatchDeskIcon } from "@/components/ui/MatchDeskIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ConfirmLeagueScoreModal } from "@/features/leagues/components/ConfirmLeagueScoreModal";
import { LeagueMatchDeskPanel } from "@/features/leagues/components/LeagueMatchDeskPanel";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import { resolveX01ConfirmScore } from "@/features/leagues/lib/league-confirm-score";
import {
  formatLeagueScoringElapsed,
  formatOutRuleLabel,
  formatX01WinnerLabel,
  getLastCompletedVisit,
  getLeagueX01ScoringSides,
  getUpcomingPlayerName,
} from "@/features/leagues/lib/league-x01-scoring-helpers";
import { isSinglesLeagueFormat } from "@/features/leagues/lib/league-game-rules";
import { abandonActiveMatchCloud } from "@/features/match-play/lib/abandon-active-match-cloud";
import { persistPlayingMatchToCloudStore } from "@/features/match-play/lib/active-match-snapshot";
import { flushActiveMatchCloudSync } from "@/features/match-play/lib/flush-active-match-cloud-sync";
import {
  clearLeagueNightBoardGame,
  saveLeagueNightBoardGame,
} from "@/features/leagues/lib/league-night-saved-games";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCheckoutSuggestions } from "@/features/x01/lib/x01-checkout";
import { getX01SideLegsWon } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { resolveCheckoutCalloutForPlayer } from "@/lib/checkout-callouts";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import type { DartHit } from "@/types/dart";
import {
  celebrateAfterDartThrow,
  playMatchWinCelebration,
} from "@/utils/match-celebration-sounds";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  announceCheckoutCalloutAsync,
  announceGameShotThenPlayerTurn,
  announceVisitEndAndHandOff,
  prefetchMatchPlayerVoices,
  primeCheckoutClips,
  primeGameShotClips,
  warmVoiceCache,
} from "@/utils/speech";
import { primeScoreClips } from "@/utils/score-audio";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-scoring.css";

export type LeagueX01ScoringVariant = "singles" | "team";

export function LeagueX01ScoringScreen({
  variant,
}: {
  variant: LeagueX01ScoringVariant;
}) {
  const params = useParams<{ leagueId: string; matchId: string }>();
  const router = useRouter();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const matchId =
    typeof params.matchId === "string"
      ? decodeURIComponent(params.matchId)
      : "";
  const nightHref = `/leagues/league/${leagueId}?section=night`;
  const suppressMissingGameRedirectRef = useRef(false);
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const pageStyle = {
    "--theme-primary-color": themePrimaryColor,
  } as CSSProperties;

  const { user } = useAuth();
  const { league: leagueEntry } = useLeagueDetail(leagueId);
  const { schedule, setMatchStatus } = useLeagueSchedule(leagueId);
  const { players } = useLeaguePlayers(leagueId);
  const { teams } = useLeagueTeams(leagueId);
  const match = schedule?.matches.find((entry) => entry.key === matchId) ?? null;

  const isSingles = isSinglesLeagueFormat(leagueEntry?.league.format);
  const schedulePublished = schedule?.status === "published";
  const night = useLeagueNight({
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished,
    boardCount: leagueEntry?.organization.board_count,
  });

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const weekMatches =
    match && schedule
      ? schedule.matches
          .filter((entry) => entry.weekNumber === match.weekNumber)
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];
  const matchIndexInWeek = match
    ? weekMatches.findIndex((entry) => entry.key === match.key)
    : -1;

  const game = useX01Store((state) => state.game);
  const throwDart = useX01Store((state) => state.throwDart);
  const nextPlayer = useX01Store((state) => state.nextPlayer);
  const undo = useX01Store((state) => state.undo);
  const reset = useX01Store((state) => state.reset);
  const leagueCheckoutSuggestionsEnabled = useSettingsStore(
    (state) => state.leagueCheckoutSuggestionsEnabled,
  );

  const markSavedForLater = () => {
    if (!match) {
      return;
    }
    const liveGame = useX01Store.getState().game;
    if (liveGame?.status === "playing") {
      persistPlayingMatchToCloudStore("x01", liveGame);
      saveLeagueNightBoardGame(leagueId, match.key, "x01", liveGame);
    }
    const control = night.weekState?.matchControls[match.key];
    const teamsEnabled = liveGame?.teamsEnabled ?? variant === "team";
    night.setMatchControlStatus(match.key, "paused", {
      homeScore:
        liveGame != null
          ? getX01SideLegsWon(liveGame.players, 0, teamsEnabled)
          : (control?.homeScore ?? 0),
      awayScore:
        liveGame != null
          ? getX01SideLegsWon(liveGame.players, 1, teamsEnabled)
          : (control?.awayScore ?? 0),
      activityTitle:
        control?.board != null
          ? `Board ${control.board} Match Saved for later`
          : "Match Saved for later",
    });
  };

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [deskOpen, setDeskOpen] = useState(false);
  const [confirmScoreDismissed, setConfirmScoreDismissed] = useState(false);
  const [confirmingScore, setConfirmingScore] = useState(false);
  const [confirmScoreError, setConfirmScoreError] = useState<string | null>(
    null,
  );

  const leaveToLeagueNight = () => {
    suppressMissingGameRedirectRef.current = true;
    setDeskOpen(false);
    reset();
    router.replace(nightHref);
  };

  const saveForLaterAndLeave = () => {
    suppressMissingGameRedirectRef.current = true;
    setDeskOpen(false);
    markSavedForLater();
    void flushActiveMatchCloudSync(user?.id);
    router.replace(nightHref);
  };

  useEffect(() => {
    if (game?.status === "finished" && game.winnerId) {
      setConfirmScoreDismissed(false);
      setConfirmScoreError(null);
    }
  }, [game?.status, game?.winnerId, game?.matchId]);

  const handleConfirmScore = async () => {
    const liveGame = useX01Store.getState().game;
    if (!match || !liveGame) {
      setConfirmScoreError("Match details are unavailable.");
      return;
    }

    const result = resolveX01ConfirmScore(liveGame);
    if (!result) {
      setConfirmScoreError("Unable to resolve the match result.");
      return;
    }

    setConfirmingScore(true);
    setConfirmScoreError(null);

    const winnerLabel =
      result.winnerSide === "home" ? match.homeLabel : match.awayLabel;
    const loserLabel =
      result.winnerSide === "home" ? match.awayLabel : match.homeLabel;

    try {
      night.setMatchControlStatus(match.key, "completed", {
        winnerSide: result.winnerSide,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        activityTitle: `${winnerLabel} defeated ${loserLabel}`,
      });
      await setMatchStatus({
        matchKey: match.key,
        status: "completed",
        winnerSide: result.winnerSide,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
      suppressMissingGameRedirectRef.current = true;
      clearLeagueNightBoardGame(leagueId, match.key);
      const cloudMatchId = liveGame.matchId;
      reset();
      void abandonActiveMatchCloud(user?.id, cloudMatchId);
      router.replace(nightHref);
    } catch (caught) {
      setConfirmScoreError(
        caught instanceof Error ? caught.message : "Unable to record score.",
      );
    } finally {
      setConfirmingScore(false);
    }
  };

  useMatchFullscreen(Boolean(game));
  const voiceReady = useMatchVoiceReady({ enabled: Boolean(game) });

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    resumeReady: Boolean(game),
  });

  useEffect(() => {
    if (!game) {
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [game?.matchId]);

  useEffect(() => {
    if (!voiceReady || !game || !getMatchAudioPreferences().voice) {
      return;
    }
    warmVoiceCache();
    primeScoreClips();
    primeGameShotClips();
    primeCheckoutClips();
    prefetchMatchPlayerVoices(game.players.map(getPlayerScorecardName));
  }, [game, voiceReady]);

  useEffect(() => {
    if (game) {
      return;
    }
    if (suppressMissingGameRedirectRef.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (
        suppressMissingGameRedirectRef.current ||
        useX01Store.getState().game
      ) {
        return;
      }
      router.replace(nightHref);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [game, nightHref, router]);

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;
  const canUndo = (game?.history.length ?? 0) > 0;

  const finishCurrentTurn = (options?: { allowPartialVisit?: boolean }) => {
    const activeGame = useX01Store.getState().game;
    if (!activeGame || activeGame.visitDarts.length === 0) {
      return false;
    }
    if (
      !options?.allowPartialVisit &&
      activeGame.visitDarts.length < DARTS_PER_VISIT
    ) {
      return false;
    }

    unlockVoicePlayback();
    const audio = getMatchAudioPreferences();
    const visitTotal = getX01VisitEffectiveScore(
      activeGame,
      activeGame.visitDarts.length,
    );
    const busted = activeGame.history
      .slice(-activeGame.visitDarts.length)
      .some((entry) => entry.bust);
    const nextPlayerName = getUpcomingPlayerName(activeGame);

    if (audio.voice) {
      void announceVisitEndAndHandOff({
        visitTotal,
        busted,
        nextPlayerName,
        onAfterVisitTotal: nextPlayer,
        getCheckoutCallout: () => {
          const updatedGame = useX01Store.getState().game;
          if (!updatedGame || updatedGame.status !== "playing") {
            return null;
          }
          return resolveCheckoutCalloutForPlayer(
            updatedGame,
            updatedGame.currentPlayerIndex,
            DARTS_PER_VISIT,
          );
        },
      });
    } else {
      nextPlayer();
    }

    return true;
  };

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    const activeGame = useX01Store.getState().game;
    const audio = getMatchAudioPreferences();

    throwDart(hit);
    const updatedGame = useX01Store.getState().game;
    const gameShotOutcome =
      activeGame && updatedGame
        ? resolveGameShotOutcome(activeGame, updatedGame)
        : null;

    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGameState) =>
        getX01VisitEffectiveScore(
          activeGameState,
          activeGameState.visitDarts.length,
        ),
      { skipMatchWinCelebration: Boolean(audio.voice && gameShotOutcome === "match") },
    );

    if (gameShotOutcome && audio.voice && updatedGame) {
      const nextPlayerState =
        updatedGame.status === "playing"
          ? updatedGame.players[updatedGame.currentPlayerIndex]
          : null;
      const checkoutCallout =
        updatedGame.status === "playing"
          ? resolveCheckoutCalloutForPlayer(
              updatedGame,
              updatedGame.currentPlayerIndex,
              DARTS_PER_VISIT,
            )
          : null;

      announceGameShotThenPlayerTurn(
        gameShotOutcome,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
        gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
        checkoutCallout,
      );
      return;
    }

    const lastEntry = updatedGame?.history.at(-1);
    if (lastEntry?.bust && updatedGame?.status === "playing") {
      triggerHaptic("warning");
      finishCurrentTurn({ allowPartialVisit: true });
      return;
    }

    if (audio.voice && updatedGame?.status === "playing") {
      const dartsAvailable = DARTS_PER_VISIT - updatedGame.visitDarts.length;
      const checkoutCallout = resolveCheckoutCalloutForPlayer(
        updatedGame,
        updatedGame.currentPlayerIndex,
        dartsAvailable,
      );
      if (checkoutCallout) {
        announceCheckoutCalloutAsync(checkoutCallout);
      }
    }
  };

  const throwMiss = () => {
    if (!game || visitFull) {
      return;
    }
    triggerHaptic("warning");
    const miss: DartHit = {
      segment: "miss",
      multiplier: "miss",
      score: 0,
      label: "Miss",
    };
    playDartHitSound(miss);
    handleDartHit(miss);
  };

  const lastCompletedVisit = useMemo(
    () => (game ? getLastCompletedVisit(game) : null),
    [game],
  );

  const displayVisitDarts =
    game && game.visitDarts.length > 0 ? game.visitDarts : lastCompletedVisit?.darts ?? [];
  const displayVisitTotal =
    game && game.visitDarts.length > 0
      ? getX01VisitEffectiveScore(game, game.visitDarts.length)
      : (lastCompletedVisit?.total ?? 0);
  const displayVisitPlayerName =
    game && game.visitDarts.length > 0
      ? getPlayerScorecardName(game.players[game.currentPlayerIndex]!)
      : (lastCompletedVisit?.playerName ?? "—");

  if (!game) {
    return (
      <div className="league-scoring-page" style={pageStyle}>
        <p className="league-scoring__empty">Loading match…</p>
      </div>
    );
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isTeamVariant = variant === "team" || game.teamsEnabled;
  const sides = getLeagueX01ScoringSides(game);
  const [homeSide, awaySide] = sides;
  const homeLegs = getX01SideLegsWon(game.players, 0, game.teamsEnabled);
  const awayLegs = getX01SideLegsWon(game.players, 1, game.teamsEnabled);
  // Prefer legsPlayed so team mode (shared legsWon per teammate) does not double-count.
  const currentLeg = game.legsPlayed + 1;
  const maxLegs = game.legsToWin * 2 - 1;
  const scoreline = `${homeLegs}–${awayLegs}`;
  const lastDart = game.visitDarts.at(-1) ?? displayVisitDarts.at(-1) ?? null;
  const dartsRemaining = Math.max(0, DARTS_PER_VISIT - game.visitDarts.length);
  const checkoutPaths =
    currentPlayer && game.status === "playing"
      ? getCheckoutSuggestions(
          currentPlayer.remaining,
          game.outRule,
          dartsRemaining || DARTS_PER_VISIT,
        )
      : [];
  const checkoutPath = checkoutPaths[0] ?? null;
  const showMatchComplete =
    game.status === "finished" && game.winnerId != null;
  const confirmScoreResult = resolveX01ConfirmScore(game);
  const winnerName = formatX01WinnerLabel(game);

  const leagueName = leagueEntry?.league.name ?? "League Match";
  const formatBadge = isTeamVariant
    ? match?.boardFormat === "doubles"
      ? "Doubles"
      : match?.boardFormat === "singles"
        ? "Team Singles"
        : "Team"
    : "Singles";
  const weekLabel = match
    ? `Week ${match.weekNumber}`
    : isTeamVariant
      ? "Team Match"
      : "Singles Match";
  const matchLabel =
    matchIndexInWeek >= 0
      ? `Match ${matchIndexInWeek + 1} of ${weekMatches.length}`
      : "Match";

  return (
    <div className="league-scoring-page" style={pageStyle}>
      <header className="league-scoring__header">
        <div className="league-scoring__header-left">
          <button
            type="button"
            className="league-scoring__desk-btn"
            aria-label="Open match desk"
            onClick={() => setDeskOpen(true)}
          >
            <MatchDeskIcon className="h-5 w-5" />
          </button>
          <div className="league-scoring__brand">
            <AppBrandLogo />
          </div>
        </div>

        <div className="league-scoring__header-center">
          <p className="league-scoring__league-name">{leagueName}</p>
          <p className="league-scoring__league-week">
            {weekLabel} · {formatBadge}
          </p>
        </div>

        <div className="league-scoring__header-right">
          <div className="league-scoring__live-pill">
            <span className="league-scoring__live-dot" aria-hidden />
            <span>{game.status === "finished" ? "Final" : "Live"}</span>
          </div>
          {showMatchComplete ? (
            <button
              type="button"
              className="league-scoring__confirm-score-btn"
              onClick={() => {
                setConfirmScoreError(null);
                setConfirmScoreDismissed(false);
              }}
            >
              Confirm Score
            </button>
          ) : null}
          <span className="league-scoring__timer">
            {formatLeagueScoringElapsed(elapsedSeconds)}
          </span>
        </div>
      </header>

      <div className="league-scoring__main">
        <aside className="league-scoring__scorecard">
          <div className="league-scoring__meta-strip">
            <div className="league-scoring__meta-item">
              <span className="league-scoring__meta-label">Match</span>
              <span className="league-scoring__meta-value">{matchLabel}</span>
            </div>
            <div className="league-scoring__meta-divider" />
            <div className="league-scoring__meta-item">
              <span className="league-scoring__meta-label">Duration</span>
              <span className="league-scoring__meta-value">
                {formatLeagueScoringElapsed(elapsedSeconds)}
              </span>
            </div>
            <div className="league-scoring__meta-divider" />
            <div className="league-scoring__meta-item">
              <span className="league-scoring__meta-label">Scoring</span>
              <span className="league-scoring__meta-value league-scoring__meta-value--live">
                Official
              </span>
            </div>
          </div>

          <div
            className={cn(
              "league-scoring__card league-scoring__card--standings",
              isTeamVariant && "league-scoring__card--team",
            )}
          >
            <div className="league-scoring__format-row">
              <span className="league-scoring__format-tag">
                {game.gameType} · {formatOutRuleLabel(game.outRule)}
              </span>
              <span className="league-scoring__leg-tag">
                Leg {currentLeg}
                {maxLegs > 0 ? ` of ${maxLegs}` : ""} · {scoreline}
              </span>
            </div>

            {isTeamVariant ? (
              <>
                {[homeSide, awaySide].map((side, sideIndex) => {
                  const isHome = sideIndex === 0;
                  const teamId = isHome ? match?.homeId : match?.awayId;
                  const kind = isHome ? match?.homeKind : match?.awayKind;
                  const teamFromId =
                    kind === "team" && teamId ? teamsById.get(teamId) : undefined;
                  const teamColor =
                    teamFromId?.color ??
                    teams.find((team) => team.name === side.teamName)?.color ??
                    "#6F9E24";

                  return (
                  <div key={side.teamId}>
                    {sideIndex === 1 ? (
                      <div className="league-scoring__vs">
                        <div className="league-scoring__vs-line" />
                        <span>VS</span>
                        <div className="league-scoring__vs-line" />
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "league-scoring__team-block",
                        side.isActive && "league-scoring__team-block--active",
                      )}
                    >
                      <div className="league-scoring__team-head">
                        <PlayerAvatar
                          name={side.teamName}
                          color={teamColor}
                          size="md"
                          className="league-scoring__team-avatar"
                        />
                        <div className="league-scoring__team-copy">
                          <span className="league-scoring__team-name">
                            {side.teamName}
                          </span>
                          {side.isActive ? (
                            <span className="league-scoring__throwing-tag">
                              <span className="league-scoring__dart-dot" />
                              Throwing
                            </span>
                          ) : (
                            <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                              Best of {maxLegs} · {scoreline}
                            </span>
                          )}
                        </div>
                        <div className="league-scoring__player-score">
                          {side.remaining}
                          <span className="league-scoring__score-suffix">REM</span>
                        </div>
                      </div>
                      <div className="league-scoring__team-roster">
                        {side.players.map(({ player, index }) => {
                          const name = getPlayerScorecardName(player);
                          const isThrower = index === game.currentPlayerIndex;
                          return (
                            <div
                              key={player.id}
                              className={cn(
                                "league-scoring__roster-row",
                                isThrower && "league-scoring__roster-row--active",
                              )}
                            >
                              <PlayerAvatar
                                name={name}
                                color={player.color}
                                avatarUrl={player.avatarUrl}
                                size="sm"
                              />
                              <span className="league-scoring__roster-name">
                                {name}
                              </span>
                              {isThrower ? (
                                <span className="league-scoring__roster-tag">
                                  Up
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </>
            ) : (
              [homeSide.players[0]?.player, awaySide.players[0]?.player]
                .filter(Boolean)
                .map((player, index) => {
                  const isActive = index === game.currentPlayerIndex;
                  const name = getPlayerScorecardName(player!);
                  return (
                    <div key={player!.id}>
                      {index === 1 ? (
                        <div className="league-scoring__vs">
                          <div className="league-scoring__vs-line" />
                          <span>VS</span>
                          <div className="league-scoring__vs-line" />
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "league-scoring__player-row",
                          isActive && "league-scoring__player-row--active",
                        )}
                      >
                        <div className="league-scoring__player-id">
                          <PlayerAvatar
                            name={name}
                            color={player!.color}
                            avatarUrl={player!.avatarUrl}
                            size="sm"
                          />
                          <div className="league-scoring__player-copy">
                            <span className="league-scoring__player-name">
                              {name}
                            </span>
                            {isActive ? (
                              <span className="league-scoring__throwing-tag">
                                <span className="league-scoring__dart-dot" />
                                Throwing
                              </span>
                            ) : (
                              <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                                Best of {maxLegs} · {scoreline}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="league-scoring__player-score">
                          {player!.remaining}
                          <span className="league-scoring__score-suffix">REM</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          <div className="league-scoring__card">
            <div className="league-scoring__section-label">
              {game.visitDarts.length > 0 ? "This Turn" : "Last Turn"} —{" "}
              {displayVisitPlayerName}
            </div>
            <div className="league-scoring__last-turn-row">
              <span style={{ color: "var(--ls-ink-soft)", fontSize: "0.8rem" }}>
                {displayVisitDarts.length || 0} dart
                {displayVisitDarts.length === 1 ? "" : "s"} scored
              </span>
              <span className="league-scoring__last-turn-total">
                {displayVisitTotal}
              </span>
            </div>
            <div className="league-scoring__dart-pills">
              {Array.from({ length: DARTS_PER_VISIT }, (_, index) => {
                const dart = displayVisitDarts[index];
                return (
                  <div
                    key={index}
                    className={cn(
                      "league-scoring__dart-pill",
                      !dart && "league-scoring__dart-pill--empty",
                      dart?.multiplier === "triple" &&
                        "league-scoring__dart-pill--triple",
                    )}
                  >
                    {dart?.label ?? "—"}
                  </div>
                );
              })}
            </div>
          </div>

          {leagueCheckoutSuggestionsEnabled && checkoutPath && currentPlayer ? (
            <div className="league-scoring__card league-scoring__checkout-card">
              <div className="league-scoring__checkout-head">
                <span className="league-scoring__checkout-need">
                  Checkout Suggestion
                </span>
                <span className="league-scoring__checkout-remaining">
                  {currentPlayer.remaining} rem.
                </span>
              </div>
              <div className="league-scoring__checkout-path">
                {checkoutPath.map((step, index) => (
                  <div key={`${step}-${index}`} style={{ display: "contents" }}>
                    {index > 0 ? (
                      <span className="league-scoring__checkout-arrow">→</span>
                    ) : null}
                    <span className="league-scoring__checkout-step">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="league-scoring__scorecard-actions">
            <button
              type="button"
              className="league-scoring__btn league-scoring__btn--miss"
              onClick={throwMiss}
              disabled={visitFull || game.status !== "playing"}
            >
              Miss
            </button>
            <button
              type="button"
              className="league-scoring__btn"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button
              type="button"
              className="league-scoring__btn league-scoring__btn--primary"
              onClick={() => finishCurrentTurn()}
              disabled={!visitFull || game.status !== "playing"}
            >
              Confirm Turn
            </button>
          </div>
        </aside>

        <section className="league-scoring__board-panel">
          <div className="league-scoring__board-top">
            <div className="league-scoring__readout">
              <div className="league-scoring__readout-block">
                <span className="league-scoring__readout-label">Last Dart</span>
                <span className="league-scoring__readout-value league-scoring__readout-value--hero">
                  {lastDart?.label ?? "—"}
                </span>
              </div>
              <div className="league-scoring__readout-divider" />
              <div className="league-scoring__readout-block">
                <span className="league-scoring__readout-label">Remaining</span>
                <span className="league-scoring__readout-value">
                  {currentPlayer?.remaining ?? "—"}
                </span>
              </div>
            </div>
            <div className="league-scoring__mode-tag">
              <span className="league-scoring__mode-dot" aria-hidden />
              Dart {Math.min(game.visitDarts.length + 1, DARTS_PER_VISIT)} of{" "}
              {DARTS_PER_VISIT} · {formatBadge}
            </div>
          </div>

          <div className="league-scoring__board-stage">
            <div className="league-scoring__board-glow" aria-hidden />
            <div className="league-scoring__board-canvas">
              <Dartboard
                onHit={handleDartHit}
                recentHits={game.visitDarts}
                disabled={
                  visitFull ||
                  game.status !== "playing" ||
                  showMatchComplete
                }
                showMissButton={false}
              />
            </div>
          </div>
        </section>
      </div>

      <ConfirmLeagueScoreModal
        open={showMatchComplete && !confirmScoreDismissed}
        winnerName={winnerName}
        homeLabel={match?.homeLabel ?? homeSide.teamName}
        awayLabel={match?.awayLabel ?? awaySide.teamName}
        homeScore={confirmScoreResult?.homeScore ?? homeLegs}
        awayScore={confirmScoreResult?.awayScore ?? awayLegs}
        winnerSide={
          confirmScoreResult?.winnerSide ??
          (awaySide.players.some(({ player }) => player.id === game.winnerId)
            ? "away"
            : "home")
        }
        matchLabel={
          match
            ? `${match.homeLabel} vs ${match.awayLabel}`
            : `${homeSide.teamName} vs ${awaySide.teamName}`
        }
        weekLabel={match ? `Week ${match.weekNumber}` : undefined}
        busy={confirmingScore}
        error={confirmScoreError}
        onConfirm={() => {
          void handleConfirmScore();
        }}
        onClose={() => {
          if (!confirmingScore) {
            setConfirmScoreDismissed(true);
          }
        }}
      />

      <LeagueMatchDeskPanel
        open={deskOpen}
        onClose={() => setDeskOpen(false)}
        leagueId={leagueId}
        league={leagueEntry?.league ?? null}
        boardCount={leagueEntry?.organization.board_count}
        match={match}
        matchNumber={matchIndexInWeek >= 0 ? matchIndexInWeek + 1 : 1}
        schedule={schedule}
        players={players}
        teams={teams}
        playersById={playersById}
        teamsById={teamsById}
        onResumeScoring={() => setDeskOpen(false)}
        onLeaveToLeagueNight={leaveToLeagueNight}
        onSaveForLater={saveForLaterAndLeave}
      />
    </div>
  );
}
