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
  formatLeagueScoringElapsed,
  formatOutRuleLabel,
  getLastCompletedVisit,
  getLeagueX01ScoringSides,
} from "@/features/leagues/lib/league-x01-scoring-helpers";
import { PhoneDartPad } from "@/features/match-scoring/components/PhoneDartPad";
import { useIsPhoneScoring } from "@/features/match-scoring/hooks/useIsIPhoneScoring";
import { getCheckoutSuggestions } from "@/features/x01/lib/x01-checkout";
import { getX01SideLegsWon } from "@/features/x01/lib/x01-engine";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { getPlayerScorecardName, getScoreDigitClass } from "@/lib/player-display";
import type { PracticeTargetHighlight } from "@/features/practice/lib/practice-target-segments";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
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

interface ClubX01ScoringViewProps {
  game: X01GameState;
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

export function ClubX01ScoringView({
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
}: ClubX01ScoringViewProps) {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const isPhoneScoring = useIsPhoneScoring();
  const pageStyle = {
    "--theme-primary-color": APP_PRIMARY_COLOR,
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
  const sides = getLeagueX01ScoringSides(game);
  const [homeSide, awaySide] = sides;
  const homeLegs = getX01SideLegsWon(game.players, 0, game.teamsEnabled);
  const awayLegs = getX01SideLegsWon(game.players, 1, game.teamsEnabled);
  const currentLeg = game.legsPlayed + 1;
  const maxLegs = game.legsToWin * 2 - 1;
  const scoreline = `${homeLegs}–${awayLegs}`;
  /** Compact for player cards (avoids wrap on iPad). */
  const bestOfScoreLabel = `Bo${maxLegs} · ${scoreline}`;
  const twoSided = isTeamVariant || game.players.length === 2;
  const lastCompletedVisit = useMemo(() => getLastCompletedVisit(game), [game]);
  const displayVisitDarts =
    game.visitDarts.length > 0 ? game.visitDarts : (lastCompletedVisit?.darts ?? []);
  const displayVisitTotal =
    game.visitDarts.length > 0
      ? getX01VisitEffectiveScore(game, game.visitDarts.length)
      : (lastCompletedVisit?.total ?? 0);
  const displayVisitPlayerName =
    game.visitDarts.length > 0
      ? getPlayerScorecardName(game.players[game.currentPlayerIndex]!)
      : (lastCompletedVisit?.playerName ?? "—");
  const lastDart = game.visitDarts.at(-1) ?? displayVisitDarts.at(-1) ?? null;
  const dartsRemaining = Math.max(0, DARTS_PER_VISIT - game.visitDarts.length);
  const checkoutPath =
    currentPlayer && game.status === "playing"
      ? (getCheckoutSuggestions(
          currentPlayer.remaining,
          game.outRule,
          dartsRemaining || DARTS_PER_VISIT,
        )[0] ?? null)
      : null;

  const matchKind =
    matchKindLabel ?? (game.isBotMatch ? "Bot Match" : "Casual Match");
  const formatBadge = isTeamVariant ? "Teams" : `${game.players.length} Players`;

  const padDisabled = boardDisabled || game.status !== "playing";

  return (
    <AppChrome className="scoring-layout-shell club-match-scoring-shell">
    <div
      className={cn("league-scoring-page", isPhoneScoring && "league-scoring-page--phone-pad")}
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
            className="league-scoring__desk-btn league-scoring__desk-btn--stats"
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
          <p className="league-scoring__league-name">{game.gameType}</p>
          <p className="league-scoring__league-week">
            {matchKind} · {formatOutRuleLabel(game.outRule)}
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
                {[homeSide, awaySide].map((side, sideIndex) => (
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
                        <ScoringPlayerAvatar
                          name={side.teamName}
                          color={side.players[0]?.player.color ?? "#6F9E24"}
                          countryCode={side.players[0]?.player.countryCode}
                          size="md"
                          className="league-scoring__team-avatar"
                        />
                        <div className="league-scoring__team-copy">
                          <span className="league-scoring__team-name">{side.teamName}</span>
                          {side.isActive ? (
                            <span className="league-scoring__throwing-tag">
                              <span className="league-scoring__dart-dot" />
                              Throwing
                            </span>
                          ) : (
                            <span className="league-scoring__throwing-tag league-scoring__throwing-tag--idle">
                              {bestOfScoreLabel}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "league-scoring__player-score",
                            getScoreDigitClass(side.remaining),
                          )}
                        >
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
                              <ScoringPlayerAvatar
                                name={name}
                                color={player.color}
                                avatarUrl={player.avatarUrl}
                                countryCode={player.countryCode}
                                size="md"
                              />
                              <span className="league-scoring__roster-name">{name}</span>
                              {isThrower ? (
                                <span className="league-scoring__roster-tag">Up</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : twoSided ? (
              game.players.map((player, index) => {
                const isActive = index === game.currentPlayerIndex;
                const name = getPlayerScorecardName(player);
                return (
                  <div key={player.id}>
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
                              {bestOfScoreLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "league-scoring__player-score",
                          getScoreDigitClass(player.remaining),
                        )}
                      >
                        {player.remaining}
                        <span className="league-scoring__score-suffix">REM</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              game.players.map((player, index) => {
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
                            {player.legsWon} legs
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "league-scoring__player-score",
                        getScoreDigitClass(player.remaining),
                      )}
                    >
                      {player.remaining}
                      <span className="league-scoring__score-suffix">REM</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="league-scoring__card league-scoring__card--last-turn">
            <div className="league-scoring__section-label league-scoring__last-turn-head">
              <span className="league-scoring__last-turn-title">
                {game.visitDarts.length > 0 ? "This Turn" : "Last Turn"} —{" "}
                {displayVisitPlayerName}
              </span>
              <span className="league-scoring__last-turn-meta">
                {displayVisitDarts.length || 0} dart
                {displayVisitDarts.length === 1 ? "" : "s"} scored
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
                      dart?.multiplier === "triple" && "league-scoring__dart-pill--triple",
                    )}
                  >
                    {dart?.label ?? "—"}
                  </div>
                );
              })}
            </div>
          </div>

          {checkoutPath && currentPlayer ? (
            <div className="league-scoring__card league-scoring__checkout-card">
              <div className="league-scoring__checkout-head">
                <span className="league-scoring__checkout-need">Checkout Suggestion</span>
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
                <span className="league-scoring__readout-label">Remaining</span>
                <span className="league-scoring__readout-value">
                  {currentPlayer?.remaining ?? "—"}
                </span>
              </div>
            </div>
            <div className="league-scoring__mode-tag">
              <span className="league-scoring__mode-dot" aria-hidden />
              Dart {Math.min(game.visitDarts.length + 1, DARTS_PER_VISIT)} of {DARTS_PER_VISIT} ·{" "}
              {formatBadge}
            </div>
          </div>

          {isPhoneScoring ? (
            <PhoneDartPad onHit={onDartHit} disabled={padDisabled} />
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
