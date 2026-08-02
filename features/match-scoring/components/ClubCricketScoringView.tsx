"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { AppChrome } from "@/components/layout/AppChrome";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import {
  ScoringPlayerAvatar,
  ScoringPlayerName,
} from "@/features/match-scoring/components/ScoringPlayerAvatar";
import {
  formatCricketMarkGlyph,
  formatCricketTargetLabel,
  formatLeagueScoringElapsed,
  getCricketMarkForSide,
  getLastCompletedCricketVisit,
  getLeagueCricketScoringSides,
  getLeagueCricketTargets,
} from "@/features/leagues/lib/league-cricket-scoring-helpers";
import { getCricketSideLegsWon } from "@/features/cricket/lib/cricket-engine";
import { PhoneDartPad } from "@/features/match-scoring/components/PhoneDartPad";
import { useIsIPhoneScoring } from "@/features/match-scoring/hooks/useIsIPhoneScoring";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { DARTS_PER_VISIT, formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";
import type { DartHit } from "@/types/dart";
import type { CricketGameState } from "@/types/cricket";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-scoring.css";
import "@/features/match-scoring/club-match-scoring.css";

function ChartBarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  );
}

interface ClubCricketScoringViewProps {
  game: CricketGameState;
  onDartHit: (hit: DartHit) => void;
  onMiss: () => void;
  onUndo: () => void;
  onConfirmTurn: () => void;
  onLeave: () => void;
  onOpenStats: () => void;
  boardDisabled?: boolean;
  missDisabled?: boolean;
  undoDisabled?: boolean;
  confirmDisabled?: boolean;
  practiceTarget?: PracticeTargetHighlight | null;
  practiceTargetPulseKey?: number;
  /** Overrides header + scorecard match kind (default: Casual/Bot Match). */
  matchKindLabel?: string;
  /** Extra controls in the header right cluster (e.g. Community pause). */
  headerActions?: ReactNode;
  /** In-flow strip under the header (e.g. Community pause guidance). */
  statusBanner?: ReactNode;
  swipeHandlers?: HTMLAttributes<HTMLDivElement>;
  overlay?: ReactNode;
}

export function ClubCricketScoringView({
  game,
  onDartHit,
  onMiss,
  onUndo,
  onConfirmTurn,
  onLeave,
  onOpenStats,
  boardDisabled = false,
  missDisabled = false,
  undoDisabled = false,
  confirmDisabled = false,
  practiceTarget = null,
  practiceTargetPulseKey = 0,
  matchKindLabel,
  headerActions,
  statusBanner,
  swipeHandlers,
  overlay,
}: ClubCricketScoringViewProps) {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const isIPhone = useIsIPhoneScoring();
  const pageStyle = {
    "--theme-primary-color": APP_PRIMARY_COLOR,
    "--theme-mark-color": APP_PRIMARY_COLOR,
    "--ls-accent": APP_PRIMARY_COLOR,
    "--ls-lime": APP_PRIMARY_COLOR,
    "--ls-lime-bright": APP_PRIMARY_COLOR,
  } as CSSProperties;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [game.matchId]);

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isTeamVariant = game.teamsEnabled;
  const sides = getLeagueCricketScoringSides(game);
  const [homeSide, awaySide] = sides;
  const homePlayer = homeSide.players[0]?.player ?? null;
  const awayPlayer = awaySide.players[0]?.player ?? null;
  const homeLegs = getCricketSideLegsWon(game.players, 0, game.teamsEnabled);
  const awayLegs = getCricketSideLegsWon(game.players, 1, game.teamsEnabled);
  const currentGameNumber = game.legsPlayed + 1;
  const maxGames = game.legsToWin * 2 - 1;
  const scoreline = `${homeLegs}–${awayLegs}`;
  const twoSided = isTeamVariant || game.players.length === 2;
  const targets = getLeagueCricketTargets(game);
  const variantLabel = formatCricketVariantLabel(game.variant ?? "classic");
  const bestOfLabel = `Best of ${maxGames}`;
  const matchKind =
    matchKindLabel ?? (game.isBotMatch ? "Bot Match" : "Casual Match");
  const formatBadge = isTeamVariant ? "Teams" : `${game.players.length} Players`;

  const lastCompletedVisit = useMemo(() => getLastCompletedCricketVisit(game), [game]);
  const displayVisitDarts =
    game.visitDarts.length > 0 ? game.visitDarts : (lastCompletedVisit?.darts ?? []);
  const displayVisitTotal =
    game.visitDarts.length > 0
      ? game.visitDarts.reduce((total, dart) => total + dart.score, 0)
      : (lastCompletedVisit?.total ?? 0);
  const displayVisitPlayerName =
    game.visitDarts.length > 0
      ? getPlayerScorecardName(game.players[game.currentPlayerIndex]!)
      : (lastCompletedVisit?.playerName ?? "—");
  const lastDart = game.visitDarts.at(-1) ?? displayVisitDarts.at(-1) ?? null;

  const visitBelongsToSide = (side: (typeof sides)[number]) => {
    if (game.visitDarts.length > 0) {
      return side.players.some(({ index }) => index === game.currentPlayerIndex);
    }
    if (!displayVisitPlayerName || displayVisitPlayerName === "—") {
      return false;
    }
    return side.players.some(
      ({ player }) => getPlayerScorecardName(player) === displayVisitPlayerName,
    );
  };

  const renderVisitTurn = (side: (typeof sides)[number]) => {
    const showLiveVisit = visitBelongsToSide(side);
    const visitDarts = showLiveVisit ? displayVisitDarts : [];
    const visitTotal = showLiveVisit ? displayVisitTotal : 0;
    const visitLabel =
      showLiveVisit && game.visitDarts.length > 0 ? "This turn" : "Last turn";

    return (
      <div className="league-scoring__cricket-visit">
        <div className="league-scoring__cricket-visit-head">
          <span className="league-scoring__cricket-visit-label">{visitLabel}</span>
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
                  dart?.multiplier === "triple" && "league-scoring__dart-pill--triple",
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
    side: (typeof sides)[number],
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
              <ScoringPlayerAvatar
                name={side.teamName}
                color={side.players[0]?.player.color ?? "#6F9E24"}
                countryCode={side.players[0]?.player.countryCode}
                size="md"
              />
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
                <span className="league-scoring__cricket-games-score">{scoreline}</span>
              </div>
            </div>
            <div className="league-scoring__player-score">{side.score}</div>
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
                  <ScoringPlayerAvatar
                    name={name}
                    color={player.color}
                    avatarUrl={player.avatarUrl}
                    countryCode={player.countryCode}
                    size="md"
                  />
                  <span className="league-scoring__roster-name">{name}</span>
                  {isThrower ? <span className="league-scoring__roster-tag">Up</span> : null}
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
          <ScoringPlayerAvatar
            name={name}
            color={player.color}
            avatarUrl={player.avatarUrl}
            countryCode={player.countryCode}
            size="md"
          />
          <div className="league-scoring__cricket-side-identity">
            <ScoringPlayerName name={name} countryCode={player.countryCode} />
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
            <span className="league-scoring__cricket-games-score">{scoreline}</span>
          </div>
        </div>
        <div className="league-scoring__player-score">{player.score}</div>
        {renderVisitTurn(side)}
      </div>
    );
  };

  const padDisabled = boardDisabled || game.status !== "playing";

  return (
    <AppChrome className="scoring-layout-shell club-match-scoring-shell">
    <div
      className={cn(
        "league-scoring-page",
        "league-scoring-page--cricket",
        isIPhone && "league-scoring-page--phone-pad",
      )}
      style={pageStyle}
      data-board-theme={boardThemeId}
      {...swipeHandlers}
    >
      <header className="league-scoring__header">
        <div className="league-scoring__header-left">
          <button
            type="button"
            className="league-scoring__desk-btn"
            aria-label="Leave match"
            onPointerDownCapture={onLeave}
            onClick={onLeave}
          >
            <LeaveIcon />
          </button>
          <button
            type="button"
            className="league-scoring__desk-btn"
            aria-label="Open match stats"
            onClick={onOpenStats}
          >
            <ChartBarIcon />
          </button>
          <div className="league-scoring__brand">
            <AppBrandLogo />
          </div>
        </div>

        <div className="league-scoring__header-center">
          <p className="league-scoring__league-name">{variantLabel}</p>
          <p className="league-scoring__league-week">
            {matchKind}
            {game.cutThroat ? " · Cut Throat" : ""}
          </p>
        </div>

        <div className="league-scoring__header-right">
          <div className="league-scoring__live-pill">
            <span className="league-scoring__live-dot" aria-hidden />
            <span>{game.status === "finished" ? "Final" : "Live"}</span>
          </div>
          <span className="league-scoring__timer">
            {formatLeagueScoringElapsed(elapsedSeconds)}
          </span>
          {headerActions}
        </div>
      </header>

      {statusBanner}

      <div className="league-scoring__main">
        <aside className="league-scoring__scorecard">
          <div className="league-scoring__meta-strip">
            <div className="league-scoring__meta-item">
              <span className="league-scoring__meta-label">Match</span>
              <span className="league-scoring__meta-value">{matchKind}</span>
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
                Live
              </span>
            </div>
          </div>

          {twoSided ? (
            <div
              className={cn(
                "league-scoring__card league-scoring__card--standings league-scoring__card--cricket",
                isTeamVariant && "league-scoring__card--team",
                game.variant === "tactics" && "league-scoring__card--tactics",
              )}
            >
              <div className="league-scoring__cricket-columns">
                {renderSideCard(homeSide, { isHome: true })}

                <div className="league-scoring__marks-board" aria-label="Marks">
                  <div className="league-scoring__marks-heading">
                    <span className="league-scoring__marks-game-name">
                      {variantLabel}
                      {game.cutThroat ? " · Cut Throat" : ""}
                    </span>
                    <span className="league-scoring__leg-tag">
                      Game {currentGameNumber}
                      {maxGames > 0 ? ` of ${maxGames}` : ""} · {scoreline}
                    </span>
                  </div>
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
                            homeMark > 0 && !closed ? { color: APP_PRIMARY_COLOR } : undefined
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
                            awayMark > 0 && !closed ? { color: APP_PRIMARY_COLOR } : undefined
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
          ) : (
            <div className="league-scoring__card league-scoring__card--standings league-scoring__card--cricket">
              <div className="league-scoring__format-row">
                <span className="league-scoring__format-tag">
                  {variantLabel}
                  {game.cutThroat ? " · Cut Throat" : ""}
                </span>
                <span className="league-scoring__leg-tag">
                  Game {currentGameNumber}
                  {maxGames > 0 ? ` of ${maxGames}` : ""}
                </span>
              </div>
              {game.players.map((player, index) => {
                const isActive = index === game.currentPlayerIndex;
                const name = getPlayerScorecardName(player);
                return (
                  <div
                    key={player.id}
                    className={cn(
                      "league-scoring__player-row",
                      isActive && "league-scoring__player-row--active",
                    )}
                    style={index > 0 ? { marginTop: "0.55rem" } : undefined}
                  >
                    <div className="league-scoring__player-id">
                      <ScoringPlayerAvatar
                        name={name}
                        color={player.color}
                        avatarUrl={player.avatarUrl}
                        countryCode={player.countryCode}
                        size="md"
                      />
                      <div className="league-scoring__player-copy">
                        <ScoringPlayerName name={name} countryCode={player.countryCode} />
                        {isActive ? (
                          <span className="league-scoring__throwing-tag">
                            <span className="league-scoring__dart-dot" />
                            Throwing
                          </span>
                        ) : (
                          <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                            {player.legsWon} games
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="league-scoring__player-score">{player.score}</div>
                  </div>
                );
              })}
              <div className="league-scoring__cricket-visit" style={{ marginTop: "0.75rem" }}>
                <div className="league-scoring__cricket-visit-head">
                  <span className="league-scoring__cricket-visit-label">
                    {game.visitDarts.length > 0 ? "This turn" : "Last turn"} —{" "}
                    {displayVisitPlayerName}
                  </span>
                  <span className="league-scoring__last-turn-total">{displayVisitTotal}</span>
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
            </div>
          )}

          <div className="league-scoring__scorecard-actions">
            <button
              type="button"
              className="league-scoring__btn league-scoring__btn--miss"
              onClick={onMiss}
              disabled={missDisabled || game.status !== "playing"}
            >
              Miss
            </button>
            <button
              type="button"
              className="league-scoring__btn"
              onClick={onUndo}
              disabled={undoDisabled}
            >
              Undo
            </button>
            <button
              type="button"
              className="league-scoring__btn league-scoring__btn--primary"
              onClick={onConfirmTurn}
              disabled={confirmDisabled || game.status !== "playing"}
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
              Dart {Math.min(game.visitDarts.length + 1, DARTS_PER_VISIT)} of {DARTS_PER_VISIT} ·{" "}
              {formatBadge}
            </div>
          </div>

          {isIPhone ? (
            <PhoneDartPad
              onHit={onDartHit}
              disabled={padDisabled}
              cricketVariant={game.variant ?? "classic"}
            />
          ) : (
            <div className="league-scoring__board-stage">
              <div className="league-scoring__board-glow" aria-hidden />
              <div className="league-scoring__board-canvas">
                <Dartboard
                  onHit={onDartHit}
                  recentHits={game.visitDarts}
                  disabled={boardDisabled || game.status !== "playing"}
                  showMissButton={false}
                  practiceTarget={practiceTarget}
                  practiceTargetHeavyPulse
                  practiceTargetPulseKey={practiceTargetPulseKey}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {overlay}
    </div>
    </AppChrome>
  );
}
