"use client";

import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";
import type {
  SampleLeagueActivityItem,
  SampleLeagueRosterPlayer,
} from "@/features/leagues/lib/sample-league-dashboard";
import { LeagueRosterPlayerRow } from "@/features/leagues/components/LeagueRosterPlayerRow";
import { cn } from "@/utils/cn";

export interface LeagueDetailChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  subtitle?: string;
  actionLabel?: string;
  actionSection?: LeagueDetailSectionId;
  emphasize?: boolean;
}

export interface LeagueDetailOverviewModel {
  venueName: string;
  seasonName: string | null;
  formatLabel: string | null;
  competitionFormatLabel: string | null;
  gameFormatLabel: string | null;
  maxPlayers: number | null;
  matchDay: string | null;
  matchTime: string | null;
  startsOn: string | null;
  endsOn: string | null;
  playerCount: number;
  pendingInvites: number;
  teamCount: number;
  matchCount: number;
  hasPlayers: boolean;
  hasTeams: boolean;
  hasSchedule: boolean;
  isPublished: boolean;
  checklist: LeagueDetailChecklistItem[];
  roster: SampleLeagueRosterPlayer[];
  activity: SampleLeagueActivityItem[];
}

interface LeagueDetailOverviewProps {
  overview: LeagueDetailOverviewModel;
  onSelectSection: (section: LeagueDetailSectionId) => void;
  onEditLeague?: () => void;
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
  const completeCount = overview.checklist.filter((item) => item.complete).length;
  const setupPercent = Math.round(
    (completeCount / Math.max(overview.checklist.length, 1)) * 100,
  );
  const avgPerTeam =
    overview.teamCount > 0
      ? Math.round((overview.playerCount / overview.teamCount) * 10) / 10
      : null;

  return (
    <div className="league-workspace">
      <div className="league-workspace__main">
        {!overview.isPublished ? (
          <section className="league-detail-card league-setup">
            <div className="league-setup__top">
              <SetupProgressRing percent={setupPercent} />
              <div className="league-setup__copy">
                <h2 className="league-setup__title">League Setup</h2>
                <p className="league-setup__desc">
                  Your league is being configured. Finish the steps below to open
                  registration and publish it to players.
                </p>
              </div>
            </div>

            <ul className="league-setup__checklist">
              {overview.checklist.map((item) => (
                <li key={item.id} className="league-setup__item">
                  <div className="league-setup__item-left">
                    <span
                      className={cn(
                        "league-setup__icon",
                        item.complete
                          ? "league-setup__icon--done"
                          : "league-setup__icon--todo",
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
                    <div>
                      <p
                        className={cn(
                          "league-setup__item-label",
                          item.complete && "league-setup__item-label--done",
                        )}
                      >
                        {item.label}
                      </p>
                      {item.subtitle ? (
                        <p className="league-setup__item-sub">{item.subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  {item.complete ? (
                    <span className="league-setup__done-tag">Done</span>
                  ) : item.actionLabel ? (
                    <button
                      type="button"
                      className={cn(
                        "league-setup__action",
                        item.emphasize && "league-setup__action--emph",
                      )}
                      onClick={() => {
                        if (item.actionSection) {
                          onSelectSection(item.actionSection);
                        }
                      }}
                    >
                      {item.actionLabel}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Players</h2>
            <div className="league-roster__controls">
              <button
                type="button"
                className="league-btn league-btn--primary"
                onClick={() => onSelectSection("players")}
              >
                Add Players
              </button>
            </div>
          </div>

          {overview.roster.length > 0 ? (
            <>
              <ul className="league-roster">
                {overview.roster.slice(0, 10).map((player) => (
                  <LeagueRosterPlayerRow key={player.id} player={player} />
                ))}
              </ul>
              <div className="league-roster__footer">
                <button
                  type="button"
                  className="league-link"
                  onClick={() => onSelectSection("players")}
                >
                  View All Players →
                </button>
              </div>
            </>
          ) : (
            <div className="league-empty">
              <p className="league-empty__title">No players yet</p>
              <p className="league-empty__sub">
                Add players to begin building your roster.
              </p>
              <button
                type="button"
                className="league-btn league-btn--primary"
                onClick={() => onSelectSection("players")}
              >
                Add Players
              </button>
            </div>
          )}
        </section>
      </div>

      <aside className="league-workspace__side">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">League Information</h2>
            <button
              type="button"
              className="league-link"
              onClick={() => {
                onEditLeague?.();
              }}
            >
              Edit
            </button>
          </div>
          <dl className="league-info">
            <div className="league-info__row">
              <dt>Venue</dt>
              <dd>{overview.venueName}</dd>
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
              <dt>League Format</dt>
              <dd>{overview.competitionFormatLabel ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Game Format</dt>
              <dd>{overview.gameFormatLabel ?? "Not set"}</dd>
            </div>
            <div className="league-info__row">
              <dt>Maximum players</dt>
              <dd>
                {overview.maxPlayers != null ? overview.maxPlayers : "Not set"}
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

        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Recent Activity</h2>
          </div>
          {overview.activity.length > 0 ? (
            <ol className="league-timeline">
              {overview.activity.slice(0, 6).map((item) => (
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
            <h2 className="league-detail-card__title">At a Glance</h2>
          </div>
          <div className="league-summary-stats">
            <div className="league-summary-stats__item">
              <p className="league-summary-stats__label">Players</p>
              <p className="league-summary-stats__value">
                {overview.maxPlayers != null && overview.maxPlayers > 0
                  ? `${overview.playerCount}/${overview.maxPlayers}`
                  : overview.playerCount}
              </p>
              <p className="league-summary-stats__foot">
                {overview.pendingInvites > 0
                  ? `${overview.pendingInvites} pending`
                  : overview.playerCount === 0
                    ? "None yet"
                    : "players"}
              </p>
            </div>
            <div className="league-summary-stats__item">
              <p className="league-summary-stats__label">Teams</p>
              <p className="league-summary-stats__value">{overview.teamCount}</p>
              <p className="league-summary-stats__foot">
                {avgPerTeam != null ? `Avg. ${avgPerTeam} / team` : "None yet"}
              </p>
            </div>
            <div className="league-summary-stats__item">
              <p className="league-summary-stats__label">Matches</p>
              <p className="league-summary-stats__value">{overview.matchCount}</p>
              <p className="league-summary-stats__foot">
                {overview.matchCount === 0 ? "Not scheduled" : "Scheduled"}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
