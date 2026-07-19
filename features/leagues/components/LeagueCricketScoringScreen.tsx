"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { MatchDeskIcon } from "@/components/ui/MatchDeskIcon";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { LeagueMatchDeskPanel } from "@/features/leagues/components/LeagueMatchDeskPanel";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import {
  formatCricketMarkGlyph,
  formatCricketTargetLabel,
  formatCricketWinnerLabel,
  formatLeagueScoringElapsed,
  getCricketMarkForSide,
  getLastCompletedCricketVisit,
  getLeagueCricketScoringSides,
  getLeagueCricketTargets,
} from "@/features/leagues/lib/league-cricket-scoring-helpers";
import { isSinglesLeagueFormat } from "@/features/leagues/lib/league-game-rules";
import { persistPlayingMatchToCloudStore } from "@/features/match-play/lib/active-match-snapshot";
import { flushActiveMatchCloudSync } from "@/features/match-play/lib/flush-active-match-cloud-sync";
import {
  clearLeagueNightBoardGame,
  saveLeagueNightBoardGame,
} from "@/features/leagues/lib/league-night-saved-games";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  finishCricketTurn,
  getCricketSideLegsWon,
  getCricketVisitPointsScored,
} from "@/features/cricket/lib/cricket-engine";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import {
  useActiveBoardThemeMarkColor,
  useActiveBoardThemePrimaryColor,
} from "@/hooks/useActiveBoardThemePrimaryColor";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import {
  DARTS_PER_VISIT,
  formatCricketVariantLabel,
} from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import type { DartHit } from "@/types/dart";
import {
  celebrateAfterDartThrow,
  celebrateAfterFinishTurn,
  playMatchWinCelebration,
} from "@/utils/match-celebration-sounds";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  announceGameShotThenPlayerTurn,
  announceVisitTotalThenPlayerTurn,
  prefetchMatchPlayerVoices,
  primeGameShotClips,
  warmVoiceCache,
} from "@/utils/speech";
import { announceCricketTargetClosed, primeCricketClosedClips } from "@/utils/cricket-closed-audio";
import { primeScoreClips } from "@/utils/score-audio";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-scoring.css";

export type LeagueCricketScoringVariant = "singles" | "team";

export function LeagueCricketScoringScreen({
  variant,
}: {
  variant: LeagueCricketScoringVariant;
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
  const themeMarkColor = useActiveBoardThemeMarkColor();
  const pageStyle = {
    "--theme-primary-color": themePrimaryColor,
    "--theme-mark-color": themeMarkColor,
  } as CSSProperties;

  const { user } = useAuth();
  const { league: leagueEntry } = useLeagueDetail(leagueId);
  const { schedule } = useLeagueSchedule(leagueId);
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

  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);
  const rematch = useCricketStore((state) => state.rematch);
  const reset = useCricketStore((state) => state.reset);

  const markSavedForLater = () => {
    if (!match) {
      return;
    }
    const liveGame = useCricketStore.getState().game;
    if (liveGame?.status === "playing") {
      persistPlayingMatchToCloudStore("cricket", liveGame);
      saveLeagueNightBoardGame(leagueId, match.key, "cricket", liveGame);
    }
    const control = night.weekState?.matchControls[match.key];
    const teamsEnabled = liveGame?.teamsEnabled ?? variant === "team";
    night.setMatchControlStatus(match.key, "paused", {
      homeScore:
        liveGame != null
          ? getCricketSideLegsWon(liveGame.players, 0, teamsEnabled)
          : (control?.homeScore ?? 0),
      awayScore:
        liveGame != null
          ? getCricketSideLegsWon(liveGame.players, 1, teamsEnabled)
          : (control?.awayScore ?? 0),
      activityTitle:
        control?.board != null
          ? `Board ${control.board} Match Saved for later`
          : "Match Saved for later",
    });
  };

  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "cricket",
    onReset: () => {
      suppressMissingGameRedirectRef.current = true;
      if (match) {
        clearLeagueNightBoardGame(leagueId, match.key);
        night.setMatchControlStatus(match.key, "waiting", {
          activityTitle:
            night.weekState?.matchControls[match.key]?.board != null
              ? `Board ${night.weekState.matchControls[match.key]!.board} Match board session ended`
              : "Match board session ended",
        });
      }
      reset();
    },
    exitHref: nightHref,
    onSaveLeave: markSavedForLater,
    copy: {
      eyebrow: "Leave match",
      title: "Leave match?",
      description:
        "Save for later to resume from Match Control, or end the match and discard the board session.",
      confirmLabel: "Save for later",
      cancelLabel: "Keep playing",
      secondaryLabel: "End match",
    },
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [deskOpen, setDeskOpen] = useState(false);

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
    primeCricketClosedClips(game.variant ?? "classic");
    primeGameShotClips();
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
        useCricketStore.getState().game
      ) {
        return;
      }
      router.replace(nightHref);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [game, nightHref, router]);

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;
  const canUndo = (game?.history.length ?? 0) > 0;

  const handleFinishTurn = () => {
    const activeGame = useCricketStore.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    unlockVoicePlayback();
    const audio = getMatchAudioPreferences();
    const nextGame = finishCricketTurn(activeGame);
    const visitTotal = getCricketVisitPointsScored(activeGame);
    const gameShotOutcome = resolveGameShotOutcome(activeGame, nextGame);

    finishTurn();
    celebrateAfterFinishTurn(useCricketStore.getState().game, {
      skipMatchWinCelebration: Boolean(audio.voice && gameShotOutcome === "match"),
    });

    if (!audio.voice) {
      return;
    }

    if (gameShotOutcome) {
      const nextPlayerState =
        nextGame.status === "playing"
          ? nextGame.players[nextGame.currentPlayerIndex]
          : null;

      announceGameShotThenPlayerTurn(
        gameShotOutcome,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
        gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
      );
      return;
    }

    const nextPlayerState =
      nextGame.status === "playing"
        ? nextGame.players[nextGame.currentPlayerIndex]
        : null;

    announceVisitTotalThenPlayerTurn(
      visitTotal,
      false,
      nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
    );
  };

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    const historyLengthBefore =
      useCricketStore.getState().game?.history.length ?? 0;

    throwDart(hit);
    const updatedGame = useCricketStore.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) =>
        activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );

    if (updatedGame && getMatchAudioPreferences().voice) {
      if (updatedGame.history.length <= historyLengthBefore) {
        return;
      }

      const lastEntry = updatedGame.history.at(-1);
      if (lastEntry?.segmentClosed) {
        announceCricketTargetClosed(
          lastEntry.segmentClosed,
          updatedGame.variant ?? "classic",
        );
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
    () => (game ? getLastCompletedCricketVisit(game) : null),
    [game],
  );

  const displayVisitDarts =
    game && game.visitDarts.length > 0
      ? game.visitDarts
      : (lastCompletedVisit?.darts ?? []);
  const displayVisitTotal =
    game && game.visitDarts.length > 0
      ? getCricketVisitPointsScored(game)
      : (lastCompletedVisit?.total ?? 0);
  const displayVisitPlayerName =
    game && game.visitDarts.length > 0
      ? getPlayerScorecardName(game.players[game.currentPlayerIndex]!)
      : (lastCompletedVisit?.playerName ?? "—");

  if (!game) {
    return (
      <div className="league-scoring-page league-scoring-page--cricket" style={pageStyle}>
        <p className="league-scoring__empty">Loading match…</p>
      </div>
    );
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isTeamVariant = variant === "team" || game.teamsEnabled;
  const sides = getLeagueCricketScoringSides(game);
  const [homeSide, awaySide] = sides;
  const homePlayer = homeSide.players[0]?.player ?? null;
  const awayPlayer = awaySide.players[0]?.player ?? null;
  const homeLegs = getCricketSideLegsWon(game.players, 0, game.teamsEnabled);
  const awayLegs = getCricketSideLegsWon(game.players, 1, game.teamsEnabled);
  const currentGameNumber = game.legsPlayed + 1;
  const maxGames = game.legsToWin * 2 - 1;
  const scoreline = `${homeLegs}–${awayLegs}`;
  const lastDart = game.visitDarts.at(-1) ?? displayVisitDarts.at(-1) ?? null;
  const targets = getLeagueCricketTargets(game);
  const showMatchComplete =
    game.status === "finished" && game.winnerId != null;
  const winnerName = formatCricketWinnerLabel(game);
  const variantLabel = formatCricketVariantLabel(game.variant ?? "classic");
  const progressLabel = "Game";
  const bestOfLabel = `Best of ${maxGames}`;
  const gamesScoreline = scoreline;

  const visitBelongsToSide = (side: typeof homeSide) => {
    if (game.visitDarts.length > 0) {
      return side.players.some(
        ({ index }) => index === game.currentPlayerIndex,
      );
    }
    if (!displayVisitPlayerName || displayVisitPlayerName === "—") {
      return false;
    }
    return side.players.some(
      ({ player }) => getPlayerScorecardName(player) === displayVisitPlayerName,
    );
  };

  const renderVisitTurn = (side: typeof homeSide) => {
    const showLiveVisit = visitBelongsToSide(side);
    const visitDarts = showLiveVisit ? displayVisitDarts : [];
    const visitTotal = showLiveVisit ? displayVisitTotal : 0;
    const visitLabel =
      showLiveVisit && game.visitDarts.length > 0 ? "This turn" : "Last turn";

    return (
      <div className="league-scoring__cricket-visit">
        <div className="league-scoring__cricket-visit-head">
          <span className="league-scoring__cricket-visit-label">
            {visitLabel}
          </span>
          <span className="league-scoring__last-turn-total">{visitTotal}</span>
        </div>
        <div className="league-scoring__dart-pills">
          {Array.from({ length: DARTS_PER_VISIT }, (_, index) => {
            const dart = visitDarts[index];
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
    );
  };

  const renderSideCard = (
    side: typeof homeSide,
    options: { isHome: boolean },
  ) => {
    if (isTeamVariant) {
      return (
        <div
          className={cn(
            "league-scoring__cricket-side",
            "league-scoring__team-block",
            side.isActive && "league-scoring__team-block--active",
          )}
        >
          <div className="league-scoring__cricket-side-head">
            <div className="league-scoring__cricket-side-top">
              <div className="league-scoring__cricket-side-identity">
                <span className="league-scoring__team-name">{side.teamName}</span>
                {side.isActive ? (
                  <span className="league-scoring__throwing-tag">
                    <span className="league-scoring__dart-dot" />
                    Throwing
                  </span>
                ) : (
                  <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                    {bestOfLabel}
                  </span>
                )}
                <span className="league-scoring__cricket-games-score">
                  {gamesScoreline}
                </span>
              </div>
            </div>
            <div className="league-scoring__player-score">
              {side.score}
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
                  <span className="league-scoring__roster-name">{name}</span>
                  {isThrower ? (
                    <span className="league-scoring__roster-tag">Up</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {renderVisitTurn(side)}
        </div>
      );
    }

    const player = options.isHome ? homePlayer : awayPlayer;
    if (!player) {
      return null;
    }
    const playerIndex = options.isHome ? 0 : 1;
    const isActive = game.currentPlayerIndex === playerIndex;
    const name = getPlayerScorecardName(player);

    return (
      <div
        className={cn(
          "league-scoring__cricket-side",
          "league-scoring__player-row",
          isActive && "league-scoring__player-row--active",
        )}
      >
        <div className="league-scoring__cricket-side-top">
          <PlayerAvatar
            name={name}
            color={player.color}
            avatarUrl={player.avatarUrl}
            size="md"
          />
          <div className="league-scoring__cricket-side-identity">
            <span className="league-scoring__player-name">{name}</span>
            {isActive ? (
              <span className="league-scoring__throwing-tag">
                <span className="league-scoring__dart-dot" />
                Throwing
              </span>
            ) : (
              <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                {bestOfLabel}
              </span>
            )}
            <span className="league-scoring__cricket-games-score">
              {gamesScoreline}
            </span>
          </div>
        </div>
        <div className="league-scoring__player-score">
          {player.score}
        </div>
        {renderVisitTurn(side)}
      </div>
    );
  };

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
    <div className="league-scoring-page league-scoring-page--cricket" style={pageStyle}>
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
              onClick={requestExit}
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
              "league-scoring__card league-scoring__card--standings league-scoring__card--cricket",
              isTeamVariant && "league-scoring__card--team",
              game.variant === "tactics" && "league-scoring__card--tactics",
            )}
          >
            <div className="league-scoring__format-row">
              <span className="league-scoring__format-tag">
                {variantLabel}
                {game.cutThroat ? " · Cut Throat" : ""}
              </span>
              <span className="league-scoring__leg-tag">
                {progressLabel} {currentGameNumber}
                {maxGames > 0 ? ` of ${maxGames}` : ""} · {scoreline}
              </span>
            </div>

            <div className="league-scoring__cricket-columns">
              {renderSideCard(homeSide, { isHome: true })}

              <div className="league-scoring__marks-board" aria-label="Marks">
                {targets.map((target) => {
                  const homeMark = getCricketMarkForSide(game, homeSide, target);
                  const awayMark = getCricketMarkForSide(game, awaySide, target);
                  const closed = homeMark >= 3 && awayMark >= 3;
                  return (
                    <div
                      key={String(target)}
                      className={cn(
                        "league-scoring__marks-row",
                        closed && "league-scoring__marks-row--closed",
                      )}
                    >
                      <span
                        className={cn(
                          "league-scoring__mark-cell",
                          homeMark >= 3 && "league-scoring__mark-cell--closed",
                        )}
                        style={
                          homeMark > 0 && !closed
                            ? { color: themeMarkColor }
                            : undefined
                        }
                      >
                        {formatCricketMarkGlyph(homeMark)}
                      </span>
                      <span className="league-scoring__marks-target">
                        {formatCricketTargetLabel(target)}
                      </span>
                      <span
                        className={cn(
                          "league-scoring__mark-cell",
                          awayMark >= 3 && "league-scoring__mark-cell--closed",
                        )}
                        style={
                          awayMark > 0 && !closed
                            ? { color: themeMarkColor }
                            : undefined
                        }
                      >
                        {formatCricketMarkGlyph(awayMark)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {renderSideCard(awaySide, { isHome: false })}
            </div>
          </div>

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
              onClick={handleFinishTurn}
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
                <span className="league-scoring__readout-label">Points</span>
                <span className="league-scoring__readout-value">
                  {currentPlayer?.score ?? "—"}
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

      <MatchCompletePanel
        open={showMatchComplete}
        winnerName={winnerName}
        onRematch={() => {
          rematch();
          setElapsedSeconds(0);
        }}
        onHome={requestExit}
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

      {endMatchConfirmDialog}
    </div>
  );
}
