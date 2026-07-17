"use client";

import type { ReactNode } from "react";
import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";
import type { LeagueOverviewDashboard } from "@/features/leagues/lib/league-overview";
import { cn } from "@/utils/cn";

export type { LeagueOverviewDashboard as LeagueDetailOverviewModel };

interface LeagueDetailOverviewProps {
  overview: LeagueOverviewDashboard;
  onSelectSection: (section: LeagueDetailSectionId) => void;
  onEditLeague?: () => void;
}

function MetricCard({
  label,
  children,
  foot,
}: {
  label: string;
  children: ReactNode;
  foot?: string | null;
}) {
  return (
    <article className="league-detail-card league-overview-metric">
      <p className="league-overview-metric__label">{label}</p>
      <div className="league-overview-metric__value">{children}</div>
      {foot ? <p className="league-overview-metric__foot">{foot}</p> : null}
    </article>
  );
}

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function SetupProgressRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="league-setup__ring" aria-hidden>
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle
          cx="52"
          cy="52"
          r={RING_RADIUS}
          fill="none"
          className="league-setup__ring-track"
          strokeWidth="10"
        />
        <circle
          cx="52"
          cy="52"
          r={RING_RADIUS}
          fill="none"
          className="league-setup__ring-progress"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="league-setup__ring-center">
        <span className="league-setup__ring-pct">{Math.round(clamped)}%</span>
        <span className="league-setup__ring-lbl">Setup</span>
      </div>
    </div>
  );
}

export function LeagueDetailOverview({
  overview,
  onSelectSection,
  onEditLeague,
}: LeagueDetailOverviewProps) {
  const handleAction = (
    section: LeagueDetailSectionId | "settings" | undefined,
  ) => {
    if (!section || section === "settings") {
      onEditLeague?.();
      return;
    }
    onSelectSection(section);
  };

  const playersDisplay =
    overview.maxPlayers != null && overview.maxPlayers > 0
      ? `${overview.playerCount} / ${overview.maxPlayers}`
      : String(overview.playerCount);
  const setupCompleteCount = overview.checklist.filter(
    (item) => item.complete,
  ).length;
  const setupPercent = Math.round(
    (setupCompleteCount / Math.max(overview.checklist.length, 1)) * 100,
  );

  return (
    <div className="league-overview">
      <div className="league-overview__metrics">
        <MetricCard
          label="Next League Night"
          foot={overview.nextNightSummary?.startsInLabel ?? "Not scheduled"}
        >
          {overview.nextNightSummary ? (
            <>
              <span className="league-overview-metric__week">
                Week {overview.nextNightSummary.weekNumber}
              </span>
              <span>
                {[
                  overview.nextNightSummary.weekdayLabel,
                  overview.nextNightSummary.dateLabel,
                ]
                  .filter(Boolean)
                  .join(" - ") || "—"}
              </span>
              <span className="league-overview-metric__sub">
                {overview.nextNightSummary.timeLabel ?? "—"}
              </span>
            </>
          ) : (
            "—"
          )}
        </MetricCard>

        <MetricCard
          label="League Progress"
          foot={
            overview.totalWeeks > 0
              ? `${overview.progressPercent}% complete`
              : "No schedule yet"
          }
        >
          {overview.totalWeeks > 0 && overview.currentWeek != null ? (
            <>
              <span>
                Week {overview.currentWeek} of {overview.totalWeeks}
              </span>
              <div
                className="league-overview-progress"
                role="progressbar"
                aria-valuenow={overview.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="League progress"
              >
                <span
                  className="league-overview-progress__bar"
                  style={{ width: `${overview.progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            "—"
          )}
        </MetricCard>

        <MetricCard
          label="Players"
          foot={
            overview.maxPlayers != null
              ? "Current / Maximum"
              : overview.playerCount === 0
                ? "None yet"
                : "Registered"
          }
        >
          {playersDisplay}
        </MetricCard>

        <MetricCard
          label="Teams"
          foot={
            overview.isSingles
              ? "Not required for singles"
              : overview.teamCount === 0
                ? "None yet"
                : "Active teams"
          }
        >
          {overview.isSingles ? "—" : overview.teamCount}
        </MetricCard>
      </div>

      <div className="league-overview__mid">
        <section className="league-detail-card">
          <div className="league-overview-setup__top">
            <SetupProgressRing percent={setupPercent} />
            <div className="league-overview-setup__copy">
              <h3 className="league-overview-setup__title">League Setup</h3>
              <p className="league-overview-setup__desc">
                {overview.lifecycle === "setup"
                  ? "Your league is being configured. Finish the steps below to open registration and publish it to players."
                  : overview.lifecycle === "completed"
                    ? "Setup is complete. This season has finished — review checklist history below."
                    : "Setup checklist for this league. Incomplete items still need your attention."}
              </p>
              <p className="league-overview-setup__summary">
                {setupCompleteCount} of {overview.checklist.length} steps
                complete
              </p>
            </div>
          </div>
          <ul className="league-overview-checklist">
            {overview.checklist.map((item) => (
              <li key={item.id} className="league-overview-checklist__item">
                <div className="league-overview-checklist__left">
                  <span
                    className={cn(
                      "league-overview-checklist__icon",
                      item.complete
                        ? "league-overview-checklist__icon--done"
                        : "league-overview-checklist__icon--todo",
                    )}
                    aria-hidden
                  >
                    {item.complete ? (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : null}
                  </span>
                  <p
                    className={cn(
                      "league-overview-checklist__label",
                      item.complete && "league-overview-checklist__label--done",
                    )}
                  >
                    {item.label}
                  </p>
                </div>
                {item.complete ? (
                  <span className="league-overview-checklist__done">Done</span>
                ) : item.actionLabel ? (
                  <button
                    type="button"
                    className="league-link"
                    onClick={() => handleAction(item.actionSection ?? "settings")}
                  >
                    {item.actionLabel}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h3 className="league-detail-card__title">League Information</h3>
            {onEditLeague ? (
              <button
                type="button"
                className="league-link"
                onClick={onEditLeague}
              >
                Edit
              </button>
            ) : null}
          </div>
          <dl className="league-info">
            <div className="league-info__row">
              <dt>Venue</dt>
              <dd>{overview.venueName || "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Season</dt>
              <dd>{overview.seasonName ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>League Type</dt>
              <dd>{overview.formatLabel ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Game Format</dt>
              <dd>{overview.gameFormatLabel ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Registered / Maximum</dt>
              <dd>
                {overview.maxPlayers != null
                  ? `${overview.playerCount}/${overview.maxPlayers}`
                  : `${overview.playerCount}/—`}
              </dd>
            </div>
            <div className="league-info__row">
              <dt>Start</dt>
              <dd>{overview.startsOn ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>End</dt>
              <dd>{overview.endsOn ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Match Day</dt>
              <dd>{overview.matchDay ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Time</dt>
              <dd>{overview.matchTime ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Visibility</dt>
              <dd>
                <span className="league-info__visibility">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  Private
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="league-overview__bottom">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h3 className="league-detail-card__title">Recent Activity</h3>
          </div>
          {overview.activity.length > 0 ? (
            <ol className="league-timeline">
              {overview.activity.map((item) => (
                <li key={item.id} className="league-timeline__item">
                  <p className="league-timeline__title">{item.title}</p>
                  <p className="league-timeline__time">{item.timeLabel}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="league-empty__sub">No recent activity yet.</p>
          )}
        </section>

        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h3 className="league-detail-card__title">Recent Results</h3>
            {overview.recentResults.length > 0 ? (
              <button
                type="button"
                className="league-link"
                onClick={() => onSelectSection("matches")}
              >
                View Matches →
              </button>
            ) : null}
          </div>
          {overview.recentResults.length > 0 ? (
            <ul className="league-overview-results">
              {overview.recentResults.map((result) => (
                <li key={result.id} className="league-overview-results__item">
                  <div>
                    <p className="league-overview-results__title">
                      {result.summary}
                    </p>
                    <p className="league-overview-results__meta">
                      Week {result.weekNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="league-link"
                    onClick={() => onSelectSection("matches")}
                  >
                    View Match
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="league-empty">
              <p className="league-empty__title">No results yet</p>
              <p className="league-empty__sub">
                Completed matches will appear here after League Night.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
