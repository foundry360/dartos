"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PercentRadialChart } from "@/components/charts/PercentRadialChart";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { LeagueMatchStatusBadge } from "@/features/leagues/components/LeagueMatchStatusBadge";
import { LeaguePlayerCheckbox } from "@/features/leagues/components/LeaguePlayerRowMenu";
import { LeagueRowMenu } from "@/features/leagues/components/LeagueRowMenu";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { useLeagueNight } from "@/features/leagues/hooks/useLeagueNight";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";
import { getRulesFamilyForGameFormat } from "@/features/leagues/lib/league-game-rules";
import { appendNightResults } from "@/features/leagues/lib/league-night-results";
import {
  boardOptionsForNight,
  formatActivityTime,
  formatElapsed,
  isSideCheckedIn,
  LEAGUE_NIGHT_CHECK_IN_LABEL,
  resolveMatchUiStatus,
  type LeagueNightCheckInStatus,
  type MatchProgressUnit,
} from "@/features/leagues/lib/league-night";
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-night.css";

type CheckInFilter = "all" | LeagueNightCheckInStatus;

const CHECK_IN_FILTERS: Array<{ id: CheckInFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "checked_in", label: "Checked In" },
  { id: "substitute", label: "Substitute" },
  { id: "absent", label: "Absent" },
];

interface LeagueDetailNightProps {
  leagueId: string;
  onSelectSection?: (section: LeagueDetailSectionId) => void;
  /** Primary night action rendered in the section tabs row (right-aligned). */
  onNavTrailingChange?: (node: ReactNode | null) => void;
}

function NightStatusBadge({
  phase,
}: {
  phase: "pre" | "live" | "complete";
}) {
  const label =
    phase === "live" ? "LIVE" : phase === "complete" ? "Completed" : "Scheduled";

  return (
    <span
      className={cn(
        "league-night-badge",
        phase === "live" && "league-night-badge--live",
        phase === "complete" && "league-night-badge--complete",
        phase === "pre" && "league-night-badge--scheduled",
      )}
    >
      {phase === "live" ? <span className="league-night-badge__pulse" /> : null}
      {label}
    </span>
  );
}

function CheckInStatusBadge({ status }: { status: LeagueNightCheckInStatus }) {
  const isCheckedIn = status === "checked_in";

  return (
    <span
      className={cn(
        "league-night-check-badge",
        `league-night-check-badge--${status}`,
      )}
    >
      {isCheckedIn ? (
        <svg
          className="league-night-check-badge__check"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
      {LEAGUE_NIGHT_CHECK_IN_LABEL[status]}
    </span>
  );
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <article className="league-night-summary-card">
      <p className="league-night-summary-card__label">{label}</p>
      <div className="league-night-summary-card__body">{children}</div>
    </article>
  );
}

function formatArrival(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return formatActivityTime(iso);
}

export function LeagueDetailNight({
  leagueId,
  onSelectSection,
  onNavTrailingChange,
}: LeagueDetailNightProps) {
  const router = useRouter();
  const { league: leagueEntry } = useLeagueDetail(leagueId);
  const {
    schedule,
    loading: scheduleLoading,
    saving,
    setMatchStatus,
  } = useLeagueSchedule(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);

  const isSingles =
    (leagueEntry?.league.format || "").toLowerCase() === "singles";
  const schedulePublished = schedule?.status === "published";
  const rulesFamily = getRulesFamilyForGameFormat(
    leagueEntry?.league.game_format,
  );
  const progressUnit: MatchProgressUnit =
    rulesFamily === "cricket" || rulesFamily === "tactics" ? "game" : "leg";

  const night = useLeagueNight({
    leagueId,
    schedule,
    players,
    teams,
    isSingles,
    schedulePublished,
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CheckInFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedMatchKey, setExpandedMatchKey] = useState<string | null>(null);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [completeMatchKey, setCompleteMatchKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const loading =
    scheduleLoading || playersLoading || teamsLoading || !night.hydrated;

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return night.activePlayers.filter((player) => {
      const status =
        night.weekState?.checkIns[player.id]?.status ?? "pending";
      if (filter !== "all" && status !== filter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const haystack = [
        leaguePlayerDisplayName(player),
        player.nickname ?? "",
        player.teamName ?? "Unassigned",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [night.activePlayers, night.weekState?.checkIns, filter, query]);

  const nightProgress = night.nightProgress;

  const allFilteredSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every((player) => selectedIds.includes(player.id));

  const toggleAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((current) =>
        current.filter(
          (id) => !filteredPlayers.some((player) => player.id === id),
        ),
      );
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      filteredPlayers.forEach((player) => next.add(player.id));
      return [...next];
    });
  };

  const openMatch = (matchKey: string) => {
    router.push(`/leagues/league/${leagueId}/match/${matchKey}`);
  };

  const handleCheckInAction = (
    player: LeaguePlayer,
    status: LeagueNightCheckInStatus,
  ) => {
    if (night.phase === "live" && night.weekState?.checkInLocked) {
      setToast("Open attendance to edit check-in while LIVE.");
      return;
    }
    night.setCheckInStatus(player.id, status);
  };

  const handleBulkCheckIn = () => {
    if (night.phase === "live" && night.weekState?.checkInLocked) {
      setToast("Open attendance to edit check-in while LIVE.");
      return;
    }
    if (!allFilteredSelected || selectedIds.length === 0) {
      return;
    }
    night.bulkCheckIn(selectedIds);
    setSelectedIds([]);
    setToast(
      `${selectedIds.length} player${selectedIds.length === 1 ? "" : "s"} checked in.`,
    );
  };

  const requestRunLeagueNight = () => {
    if (night.checkInCounts.pending > 0) {
      setRunConfirmOpen(true);
      return;
    }
    night.runLeagueNight();
    setToast("League Night is LIVE.");
  };

  const confirmRunLeagueNight = () => {
    setRunConfirmOpen(false);
    night.runLeagueNight();
    setToast("League Night is LIVE.");
  };

  const nightPhase = night.phase;
  const nightIsUpcoming = night.isUpcoming;
  const hasNightWeek = Boolean(night.week && night.weekState);
  const nightFinalized = Boolean(night.weekState?.finalizedAt);
  const pendingCheckIns = night.checkInCounts.pending;

  useEffect(() => {
    if (!onNavTrailingChange) {
      return;
    }

    const canShowActions =
      !loading &&
      hasNightWeek &&
      !nightIsUpcoming &&
      (nightPhase === "pre" || nightPhase === "complete");

    if (!canShowActions) {
      onNavTrailingChange(null);
      return () => onNavTrailingChange(null);
    }

    if (nightPhase === "pre") {
      onNavTrailingChange(
        <button
          type="button"
          className="league-btn league-btn--primary league-detail-subnav__action"
          onClick={() => {
            if (pendingCheckIns > 0) {
              setRunConfirmOpen(true);
              return;
            }
            night.runLeagueNight();
            setToast("League Night is LIVE.");
          }}
        >
          Run League Night
        </button>,
      );
    } else {
      onNavTrailingChange(
        <button
          type="button"
          className="league-btn league-btn--primary league-detail-subnav__action"
          disabled={nightFinalized || finalizing}
          onClick={() => setFinalizeConfirmOpen(true)}
        >
          {nightFinalized
            ? "Finalized"
            : finalizing
              ? "Finalizing…"
              : "Finalize League Night"}
        </button>,
      );
    }

    return () => onNavTrailingChange(null);
    // night.runLeagueNight is stable enough for the pre-phase click handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only to avoid nav-trailing update loops
  }, [
    finalizing,
    hasNightWeek,
    loading,
    nightFinalized,
    nightIsUpcoming,
    nightPhase,
    onNavTrailingChange,
    pendingCheckIns,
  ]);

  const boardActivityTitle = (match: DraftLeagueMatch, action: string) => {
    const board = night.weekState?.matchControls[match.key]?.board;
    return board != null ? `Board ${board} Match ${action}` : `Match ${action}`;
  };

  const handleStartMatch = async (match: DraftLeagueMatch) => {
    if (busyKey || saving) {
      return;
    }
    setBusyKey(match.key);
    try {
      await setMatchStatus({ matchKey: match.key, status: "in_progress" });
      night.setMatchControlStatus(match.key, "live", {
        activityTitle: boardActivityTitle(match, "Started"),
      });
      setExpandedMatchKey(match.key);
    } catch (caught) {
      setToast(
        caught instanceof Error ? caught.message : "Unable to start match.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handlePauseMatch = (match: DraftLeagueMatch) => {
    night.setMatchControlStatus(match.key, "paused", {
      activityTitle: boardActivityTitle(match, "Paused"),
    });
  };

  const handleResumeMatch = (match: DraftLeagueMatch) => {
    night.setMatchControlStatus(match.key, "live", {
      activityTitle: boardActivityTitle(match, "Resumed"),
    });
  };

  const handleCompleteMatch = async (
    match: DraftLeagueMatch,
    winnerSide: "home" | "away",
  ) => {
    if (busyKey || saving) {
      return;
    }
    setBusyKey(match.key);
    try {
      await setMatchStatus({ matchKey: match.key, status: "completed" });
      const winnerLabel =
        winnerSide === "home" ? match.homeLabel : match.awayLabel;
      const loserLabel =
        winnerSide === "home" ? match.awayLabel : match.homeLabel;
      night.setMatchControlStatus(match.key, "completed", {
        winnerSide,
        homeScore: winnerSide === "home" ? 1 : 0,
        awayScore: winnerSide === "away" ? 1 : 0,
        activityTitle: `${winnerLabel} defeated ${loserLabel}`,
      });
      setCompleteMatchKey(null);
    } catch (caught) {
      setToast(
        caught instanceof Error ? caught.message : "Unable to complete match.",
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      for (const match of night.matches) {
        const status = night.weekState?.matchControls[match.key]?.uiStatus;
        if (
          (status === "completed" || status === "forfeited") &&
          match.status !== "completed" &&
          match.status !== "cancelled"
        ) {
          await setMatchStatus({
            matchKey: match.key,
            status: status === "forfeited" ? "cancelled" : "completed",
          });
        }
      }

      night.finalizeWeek();
      if (night.weekNumber != null) {
        appendNightResults({
          leagueId,
          weekNumber: night.weekNumber,
          matches: night.matches,
          matchControls: night.weekState?.matchControls ?? {},
        });
      }
      setFinalizeConfirmOpen(false);
      setToast(
        "League Night finalized. Standings, stats, and the next week are ready.",
      );
    } catch (caught) {
      setToast(
        caught instanceof Error
          ? caught.message
          : "Unable to finalize League Night.",
      );
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="league-night">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading League Night…</p>
          </div>
        </section>
      </div>
    );
  }

  if (!schedule || (night.matches.length === 0 && night.weeks.length === 0)) {
    return (
      <div className="league-night">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="night" />
            </div>
            <p className="league-empty__title">
              Create a schedule to enable League Night.
            </p>
            <p className="league-empty__sub">
              Generate and publish match nights so directors can run operations
              from this command center.
            </p>
            {onSelectSection ? (
              <button
                type="button"
                className="league-btn league-btn--primary"
                onClick={() => onSelectSection("schedule")}
              >
                Create Schedule
              </button>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  if (night.isUpcoming && night.week) {
    return (
      <div className="league-night">
        <section className="league-detail-card league-night-countdown">
          <div className="league-night-countdown__header">
            <NightStatusBadge phase="pre" />
            <h2 className="league-detail-card__title">Next League Night</h2>
          </div>
          <p className="league-night-countdown__week">
            Week {night.week.weekNumber}
          </p>
          <p className="league-night-countdown__when">
            {night.labels.dateLabel}
            <span aria-hidden> · </span>
            {night.labels.timeLabel}
          </p>
          <p className="league-night-countdown__timer" aria-live="polite">
            {night.countdown?.label ?? "—"}
          </p>
          <p className="league-night-countdown__hint">
            Check-in and match control unlock when this night arrives.
          </p>
        </section>
      </div>
    );
  }

  if (!night.week || !night.weekState) {
    return (
      <div className="league-night">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Season complete</p>
            <p className="league-empty__sub">
              Every scheduled league night has been finalized.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const phase = night.phase;
  const checkInLocked = phase === "live" && night.weekState.checkInLocked;

  return (
    <div className="league-night">
      <div className="league-night-summary-grid">
        {phase === "pre" ? (
          <>
            <SummaryCard label="Players">
              <p className="league-night-summary-card__value">
                {night.checkInCounts.checkedIn} / {night.activePlayers.length}
              </p>
              <p className="league-night-summary-card__meta">Checked In</p>
              <p className="league-night-summary-card__meta">
                {night.activePlayers.length} Expected Players
              </p>
            </SummaryCard>
            <SummaryCard label="League Progress">
              <p className="league-night-summary-card__value">
                {night.matchStats.completed} / {night.matchStats.scheduled}
              </p>
              <p className="league-night-summary-card__meta">Matches Complete</p>
              <p className="league-night-summary-card__meta">
                {Math.round(
                  (night.matchStats.completed /
                    Math.max(night.matchStats.scheduled, 1)) *
                    100,
                )}
                %
              </p>
            </SummaryCard>
            <SummaryCard label="Matches">
              <p className="league-night-summary-card__value">
                {night.matchStats.scheduled} Scheduled
              </p>
              <p className="league-night-summary-card__meta">
                {night.matchStats.completed} Completed
              </p>
            </SummaryCard>
            <SummaryCard label="League Readiness">
              <ul className="league-night-readiness">
                {night.readiness.items.map((item) => (
                  <li
                    key={item.label}
                    className={cn(
                      "league-night-readiness__item",
                      item.complete && "is-complete",
                    )}
                  >
                    <span aria-hidden>{item.complete ? "✓" : "○"}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
              <p className="league-night-summary-card__value league-night-summary-card__value--sm">
                Overall Readiness {night.readiness.percent}%
              </p>
            </SummaryCard>
          </>
        ) : (
          <>
            <SummaryCard label="Matches">
              <p className="league-night-summary-card__value">
                {night.matchStats.scheduled} Scheduled
              </p>
              <p className="league-night-summary-card__meta">
                {night.matchStats.live} Live · {night.matchStats.completed}{" "}
                Completed · {night.matchStats.waiting} Waiting
              </p>
            </SummaryCard>
            <SummaryCard label="Players">
              <p className="league-night-summary-card__value league-night-summary-card__value-row">
                <span>
                  {night.checkInCounts.checkedIn} Checked In
                </span>
                {phase === "live" ? (
                  <button
                    type="button"
                    className={cn(
                      "league-night-summary-card__edit",
                      !checkInLocked && "is-active",
                    )}
                    aria-pressed={!checkInLocked}
                    aria-label={
                      checkInLocked ? "Open attendance" : "Lock attendance"
                    }
                    title={
                      checkInLocked ? "Open attendance" : "Lock attendance"
                    }
                    onClick={() => night.setCheckInLocked(!checkInLocked)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                ) : null}
              </p>
              <p className="league-night-summary-card__meta">
                {night.checkInCounts.absent} Absent
              </p>
            </SummaryCard>
            <SummaryCard label="League Progress">
              <p className="league-night-summary-card__value">
                {Math.round(
                  (night.matchStats.completed /
                    Math.max(night.matchStats.scheduled, 1)) *
                    100,
                )}
                %
              </p>
              <p className="league-night-summary-card__meta">
                {night.matchStats.completed} / {night.matchStats.scheduled}{" "}
                Matches Complete
              </p>
            </SummaryCard>
            <SummaryCard label="Boards">
              <p className="league-night-summary-card__value">
                {night.boards.active} Active
              </p>
              <p className="league-night-summary-card__meta">
                {night.boards.available} Available
              </p>
            </SummaryCard>
          </>
        )}
      </div>

      <div className="league-night-layout">
        <div className="league-night-main">
          {phase === "live" && !checkInLocked ? (
            <section className="league-detail-card">
              <div className="league-detail-card__header">
                <h3 className="league-detail-card__title">
                  Attendance (Director Edit)
                </h3>
                <p className="league-match-list__count">
                  {night.checkInCounts.pending} pending
                </p>
              </div>
              <div className="league-night-attendance-edit">
                {night.activePlayers.map((player) => {
                  const status =
                    night.weekState?.checkIns[player.id]?.status ?? "pending";
                  return (
                    <div
                      key={player.id}
                      className="league-night-attendance-edit__row"
                    >
                      <span>{leaguePlayerDisplayName(player)}</span>
                      <div className="league-night-row-actions">
                        <button
                          type="button"
                          className="league-btn league-btn--ghost-dark"
                          disabled={status === "checked_in"}
                          onClick={() =>
                            handleCheckInAction(player, "checked_in")
                          }
                        >
                          Check In
                        </button>
                        <button
                          type="button"
                          className="league-btn league-btn--ghost-dark"
                          disabled={status === "absent"}
                          onClick={() => handleCheckInAction(player, "absent")}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          className="league-btn league-btn--ghost-dark"
                          disabled={status === "substitute"}
                          onClick={() =>
                            handleCheckInAction(player, "substitute")
                          }
                        >
                          Substitute
                        </button>
                        <LeagueRowMenu
                          label={`More check-in actions for ${leaguePlayerDisplayName(player)}`}
                          items={[
                            {
                              id: "pending",
                              label: "Reset to Pending",
                              onSelect: () =>
                                handleCheckInAction(player, "pending"),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {phase === "pre" ? (
            <section className="league-detail-card league-players-table-card">
              <div className="league-players__header">
                <h3 className="league-detail-card__title">Player Check-In</h3>
              </div>

              <div className="league-players__toolbar">
                <div className="league-players__search-row">
                  <label className="league-players__search">
                    <span className="sr-only">Search players</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search players"
                    />
                  </label>
                  <div className="league-players__filters" role="group">
                    {CHECK_IN_FILTERS.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={cn(
                          "league-players__filter",
                          filter === entry.id && "is-active",
                        )}
                        onClick={() => setFilter(entry.id)}
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                </div>
                {allFilteredSelected ? (
                  <button
                    type="button"
                    className="league-btn league-btn--primary"
                    onClick={handleBulkCheckIn}
                  >
                    Bulk Check In
                  </button>
                ) : null}
              </div>

              <div className="league-players-table-wrap">
                <table className="league-players-table league-night-checkin-table">
                  <colgroup>
                    <col className="league-col-check" />
                    <col className="league-col-player" />
                    <col className="league-col-team" />
                    <col className="league-col-status" />
                    <col className="league-night-col-arrival" />
                    <col className="league-night-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="league-players-table__check" scope="col">
                        <LeaguePlayerCheckbox
                          checked={allFilteredSelected}
                          onChange={toggleAllFiltered}
                          label="Select all players"
                        />
                      </th>
                      <th scope="col">Player</th>
                      <th scope="col">Team</th>
                      <th scope="col">Status</th>
                      <th scope="col">Arrival Time</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => {
                      const checkIn =
                        night.weekState?.checkIns[player.id] ?? {
                          status: "pending" as const,
                          arrivedAt: null,
                        };
                      const selected = selectedIds.includes(player.id);

                      return (
                        <tr
                          key={player.id}
                          className={cn(selected && "is-selected")}
                        >
                          <td className="league-players-table__check">
                            <LeaguePlayerCheckbox
                              checked={selected}
                              label={`Select ${leaguePlayerDisplayName(player)}`}
                              onChange={(checked) => {
                                setSelectedIds((current) =>
                                  checked
                                    ? [...current, player.id]
                                    : current.filter((id) => id !== player.id),
                                );
                              }}
                            />
                          </td>
                          <td>
                            <div className="league-players-table__player">
                              <PlayerAvatar
                                name={leaguePlayerDisplayName(player)}
                                color={player.color || APP_PRIMARY_COLOR}
                                avatarUrl={player.avatarUrl}
                              />
                              <div>
                                <p className="league-players-table__name">
                                  {leaguePlayerDisplayName(player)}
                                </p>
                                {player.nickname ? (
                                  <p className="league-players-table__nickname">
                                    {player.nickname}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="league-players-table__team">
                            {player.teamName ?? "Unassigned"}
                          </td>
                          <td>
                            <CheckInStatusBadge status={checkIn.status} />
                          </td>
                          <td>{formatArrival(checkIn.arrivedAt)}</td>
                          <td>
                            <div className="league-night-row-actions">
                              <button
                                type="button"
                                className="league-btn league-btn--ghost-dark"
                                disabled={checkIn.status === "checked_in"}
                                onClick={() =>
                                  handleCheckInAction(player, "checked_in")
                                }
                              >
                                Check In
                              </button>
                              <button
                                type="button"
                                className="league-btn league-btn--ghost-dark"
                                disabled={checkIn.status === "absent"}
                                onClick={() =>
                                  handleCheckInAction(player, "absent")
                                }
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                className="league-btn league-btn--ghost-dark"
                                disabled={checkIn.status === "substitute"}
                                onClick={() =>
                                  handleCheckInAction(player, "substitute")
                                }
                              >
                                Substitute
                              </button>
                              <LeagueRowMenu
                                label={`More check-in actions for ${leaguePlayerDisplayName(player)}`}
                                items={[
                                  {
                                    id: "pending",
                                    label: "Reset to Pending",
                                    onSelect: () =>
                                      handleCheckInAction(player, "pending"),
                                  },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="league-detail-card">
              <div className="league-detail-card__header">
                <h3 className="league-detail-card__title">Match Control</h3>
                <p className="league-match-list__count">
                  {night.matches.length} match
                  {night.matches.length === 1 ? "" : "es"}
                </p>
              </div>

              <div className="league-night-match-list" role="table">
                <div className="league-night-match-list__head" role="row">
                  <span role="columnheader">Match</span>
                  <span role="columnheader">Board</span>
                  <span role="columnheader">Home</span>
                  <span role="columnheader">Away</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Score</span>
                  <span role="columnheader">Actions</span>
                </div>
                {night.matches.map((match, index) => {
                  const homeReady = isSideCheckedIn({
                    match,
                    checkIns: night.weekState!.checkIns,
                    players: night.activePlayers,
                    teams,
                    side: "home",
                  });
                  const awayReady = isSideCheckedIn({
                    match,
                    checkIns: night.weekState!.checkIns,
                    players: night.activePlayers,
                    teams,
                    side: "away",
                  });
                  const control = night.weekState!.matchControls[match.key];
                  const status = resolveMatchUiStatus({
                    match,
                    control,
                    homeReady,
                    awayReady,
                  });
                  const expanded = expandedMatchKey === match.key;
                  const board = control?.board ?? null;
                  const boardOptions = boardOptionsForNight(
                    night.matches.length,
                  );
                  const boardEditable =
                    phase !== "complete" &&
                    status !== "completed" &&
                    status !== "forfeited";
                  const canStart =
                    phase === "live" &&
                    (status === "waiting" || status === "ready");
                  const canResume = phase === "live" && status === "paused";
                  const canPause = phase === "live" && status === "live";
                  const canComplete =
                    phase === "live" &&
                    (status === "live" || status === "paused");
                  const startDisabled = phase === "complete";

                  return (
                    <div
                      key={match.key}
                      className={cn(
                        "league-night-match-row",
                        expanded && "is-expanded",
                      )}
                    >
                      <div className="league-night-match-row__main" role="row">
                        <div
                          className="league-night-match-row__match"
                          role="cell"
                        >
                          <button
                            type="button"
                            className="league-night-board-expand"
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? "Hide match details"
                                : "Show match details"
                            }
                            onClick={() =>
                              setExpandedMatchKey(expanded ? null : match.key)
                            }
                          >
                            <span>{index + 1}</span>
                            <span aria-hidden>{expanded ? "▴" : "▾"}</span>
                          </button>
                        </div>
                        <div
                          className="league-night-match-row__board"
                          role="cell"
                        >
                          <label className="league-night-board-select-wrap">
                            <span className="sr-only">
                              Board for {match.homeLabel} vs {match.awayLabel}
                            </span>
                            <select
                              className="league-night-board-select"
                              value={board ?? ""}
                              disabled={!boardEditable}
                              onChange={(event) => {
                                const next = event.target.value;
                                night.setMatchBoard(
                                  match.key,
                                  next === "" ? null : Number(next),
                                );
                              }}
                            >
                              <option value="">-</option>
                              {boardOptions.map((option) => (
                                <option key={option} value={option}>
                                  Board {option}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div
                          className="league-night-match-row__side"
                          role="cell"
                          title={match.homeLabel}
                        >
                          {match.homeLabel}
                        </div>
                        <div
                          className="league-night-match-row__side"
                          role="cell"
                          title={match.awayLabel}
                        >
                          {match.awayLabel}
                        </div>
                        <div
                          className="league-night-match-row__status"
                          role="cell"
                        >
                          <LeagueMatchStatusBadge status={status} />
                        </div>
                        <div
                          className="league-night-score league-night-match-row__score"
                          role="cell"
                        >
                          {control?.homeScore ?? 0}–{control?.awayScore ?? 0}
                        </div>
                        <div
                          className="league-night-row-actions league-night-match-row__actions"
                          role="cell"
                        >
                          {canStart ? (
                            <button
                              type="button"
                              className="league-btn league-btn--primary"
                              disabled={
                                startDisabled ||
                                busyKey === match.key ||
                                saving
                              }
                              onClick={() => {
                                void handleStartMatch(match);
                              }}
                            >
                              {busyKey === match.key ? "Starting…" : "Start"}
                            </button>
                          ) : null}
                          {canResume ? (
                            <button
                              type="button"
                              className="league-btn league-btn--primary"
                              onClick={() => handleResumeMatch(match)}
                            >
                              Resume
                            </button>
                          ) : null}
                          {status === "live" ||
                          status === "paused" ||
                          status === "completed" ? (
                            <button
                              type="button"
                              className="league-btn league-btn--ghost-dark"
                              onClick={() => openMatch(match.key)}
                            >
                              View
                            </button>
                          ) : null}
                          {canPause ? (
                            <button
                              type="button"
                              className="league-btn league-btn--ghost-dark"
                              onClick={() => handlePauseMatch(match)}
                            >
                              Pause
                            </button>
                          ) : null}
                          {canComplete ? (
                            <button
                              type="button"
                              className="league-btn league-btn--ghost-dark"
                              onClick={() => setCompleteMatchKey(match.key)}
                            >
                              Complete
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {expanded ? (
                        <div className="league-night-match-detail">
                          <div className="league-night-match-detail__grid">
                            <div>
                              <p className="league-night-match-detail__label">
                                Format
                              </p>
                              <p className="league-night-match-detail__value">
                                {leagueEntry?.league.game_format?.toUpperCase() ||
                                  "Match"}
                              </p>
                            </div>
                            <div>
                              <p className="league-night-match-detail__label">
                                {progressUnit === "game"
                                  ? "Current Game"
                                  : "Current Leg"}
                              </p>
                              <p className="league-night-match-detail__value">
                                {(control?.homeScore ?? 0) +
                                  (control?.awayScore ?? 0) +
                                  1}
                              </p>
                            </div>
                            <div>
                              <p className="league-night-match-detail__label">
                                Players
                              </p>
                              <p className="league-night-match-detail__value">
                                {match.homeLabel} vs {match.awayLabel}
                              </p>
                            </div>
                            <div>
                              <p className="league-night-match-detail__label">
                                Current Score
                              </p>
                              <p className="league-night-match-detail__value">
                                {control?.homeScore ?? 0} –{" "}
                                {control?.awayScore ?? 0}
                              </p>
                            </div>
                            <div>
                              <p className="league-night-match-detail__label">
                                Elapsed Time
                              </p>
                              <p className="league-night-match-detail__value">
                                {formatElapsed(
                                  control?.startedAt ?? null,
                                  night.now,
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="league-btn league-btn--primary"
                            disabled={
                              status === "waiting" ||
                              status === "ready" ||
                              status === "forfeited"
                            }
                            onClick={() => openMatch(match.key)}
                          >
                            Launch Scoring
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {phase !== "pre" && night.weekState ? (
            <div className="league-night-secondary">
              <section className="league-detail-card">
                <div className="league-detail-card__header">
                  <h3 className="league-detail-card__title">
                    League Night Progress
                  </h3>
                </div>
                {nightProgress.isSample ? (
                  <p className="league-night-aside__sample-note">
                    Sample progress — updates as matches complete.
                  </p>
                ) : null}
                <div className="league-night-progress-grid">
                  <article className="league-night-microcard league-night-microcard--progress">
                    <p className="league-night-microcard__label">
                      League Night Progress
                    </p>
                    <div className="league-night-microcard__progress-body">
                      <PercentRadialChart
                        percent={nightProgress.percentComplete}
                        caption="Complete"
                        displayValue={`${nightProgress.percentComplete}%`}
                        size={128}
                        barSize={11}
                        empty={nightProgress.totalCount === 0}
                      />
                      <div className="league-night-microcard__copy">
                        <p className="league-night-microcard__value">
                          {nightProgress.percentComplete}% Complete
                        </p>
                        <p className="league-night-microcard__meta">
                          {nightProgress.completedCount} of{" "}
                          {nightProgress.totalCount} Matches Completed
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="league-night-microcard">
                    <p className="league-night-microcard__label">
                      Estimated Completion
                    </p>
                    <p className="league-night-microcard__value league-night-microcard__value--xl">
                      {nightProgress.estimatedCompletionLabel}
                    </p>
                    <p className="league-night-microcard__meta">
                      {nightProgress.remainingLabel}
                    </p>
                  </article>

                  <article className="league-night-microcard">
                    <p className="league-night-microcard__label">
                      Matches / Hour
                    </p>
                    <p className="league-night-microcard__value league-night-microcard__value--xl">
                      {nightProgress.matchesPerHourLabel}
                    </p>
                    <p className="league-night-microcard__meta">
                      Pace tonight
                    </p>
                  </article>

                  <article className="league-night-microcard">
                    <p className="league-night-microcard__label">
                      Avg Match Time
                    </p>
                    <p className="league-night-microcard__value league-night-microcard__value--xl">
                      {nightProgress.avgMatchLabel}
                    </p>
                    <p className="league-night-microcard__meta">
                      Across completed matches
                    </p>
                  </article>

                  <article className="league-night-microcard">
                    <p className="league-night-microcard__label">
                      Closest Match
                    </p>
                    {nightProgress.closestMatch ? (
                      <>
                        <ul className="league-night-closest">
                          <li>
                            <span>{nightProgress.closestMatch.homeLabel}</span>
                            <strong>
                              {nightProgress.closestMatch.homeScore}
                            </strong>
                          </li>
                          <li>
                            <span>{nightProgress.closestMatch.awayLabel}</span>
                            <strong>
                              {nightProgress.closestMatch.awayScore}
                            </strong>
                          </li>
                        </ul>
                        <p className="league-night-microcard__meta">
                          Match {nightProgress.closestMatch.matchNumber}
                        </p>
                      </>
                    ) : (
                      <p className="league-night-aside__empty">
                        Closest score appears after matches complete.
                      </p>
                    )}
                  </article>

                  <article className="league-night-microcard">
                    <p className="league-night-microcard__label">
                      Longest Match
                    </p>
                    <p className="league-night-microcard__value league-night-microcard__value--xl">
                      {nightProgress.longestMatchLabel}
                    </p>
                    <p
                      className="league-night-microcard__meta"
                      title={nightProgress.longestMatchMeta}
                    >
                      {nightProgress.longestMatchMeta}
                    </p>
                  </article>
                </div>

                {night.completedResults.length > 0 ? (
                  <ul className="league-night-results league-night-results--after-progress">
                    {night.completedResults.map((result) => {
                      const homeWon = result.winnerSide === "home";
                      const awayWon = result.winnerSide === "away";

                      return (
                        <li key={result.key} className="league-night-result">
                          <span className="league-night-result__num">
                            Match {result.matchNumber}
                          </span>
                          <p className="league-night-result__players">
                            <span
                              className={cn(
                                "league-night-result__side",
                                homeWon && "is-winner",
                              )}
                            >
                              {result.homeLabel}
                              <span className="league-night-result__wl">
                                {homeWon ? "(W)" : awayWon ? "(L)" : ""}
                              </span>
                            </span>
                            <span className="league-night-result__vs" aria-hidden>
                              vs
                            </span>
                            <span
                              className={cn(
                                "league-night-result__side",
                                awayWon && "is-winner",
                              )}
                            >
                              {result.awayLabel}
                              <span className="league-night-result__wl">
                                {awayWon ? "(W)" : homeWon ? "(L)" : ""}
                              </span>
                            </span>
                          </p>
                          <strong className="league-night-result__score">
                            {result.scoreLabel}
                          </strong>
                          <span className="league-night-result__duration">
                            {result.durationLabel}
                          </span>
                          <time
                            className="league-night-result__time"
                            dateTime={result.completedAt ?? undefined}
                          >
                            {result.completedAt
                              ? formatActivityTime(result.completedAt)
                              : "—"}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>

              <section className="league-detail-card">
                <div className="league-detail-card__header">
                  <h3 className="league-detail-card__title">Live Activity</h3>
                </div>
                {night.weekState.activity.length === 0 ? (
                  <p className="league-night-aside__empty">
                    Activity will appear as the night progresses.
                  </p>
                ) : (
                  <ol className="league-night-activity">
                    {night.weekState.activity.map((item) => (
                      <li key={item.id}>
                        <time dateTime={item.at}>
                          {formatActivityTime(item.at)}
                        </time>
                        <span>{item.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={runConfirmOpen}
        title="Players still pending"
        description={`${night.checkInCounts.pending} player${night.checkInCounts.pending === 1 ? " is" : "s are"} still pending check-in. You can continue and run League Night anyway.`}
        confirmLabel="Run Anyway"
        cancelLabel="Back to Check-In"
        onConfirm={confirmRunLeagueNight}
        onCancel={() => setRunConfirmOpen(false)}
      />

      <ConfirmDialog
        open={finalizeConfirmOpen}
        title="Finalize League Night?"
        description="This will update standings, player and team statistics, win/loss streaks, mark the week complete, activate the next scheduled week, and close League Night."
        confirmLabel="Finalize"
        cancelLabel="Not Yet"
        busy={finalizing}
        onConfirm={() => {
          void handleFinalize();
        }}
        onCancel={() => setFinalizeConfirmOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(completeMatchKey)}
        title="Complete match"
        description="Select the winning side to record tonight’s result and update the live scoreboard."
        confirmLabel={
          completeMatchKey
            ? `Winner: ${night.matches.find((match) => match.key === completeMatchKey)?.homeLabel ?? "Home"}`
            : "Home"
        }
        cancelLabel="Cancel"
        secondaryLabel={
          completeMatchKey
            ? `Winner: ${night.matches.find((match) => match.key === completeMatchKey)?.awayLabel ?? "Away"}`
            : "Away"
        }
        onConfirm={() => {
          const match = night.matches.find(
            (entry) => entry.key === completeMatchKey,
          );
          if (match) {
            void handleCompleteMatch(match, "home");
          }
        }}
        onSecondary={() => {
          const match = night.matches.find(
            (entry) => entry.key === completeMatchKey,
          );
          if (match) {
            void handleCompleteMatch(match, "away");
          }
        }}
        onCancel={() => setCompleteMatchKey(null)}
      />

      {toast ? (
        <div className="league-players-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
