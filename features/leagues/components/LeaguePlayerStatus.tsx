"use client";

import {
  LEAGUE_PLAYER_STATUS_LABEL,
  VECTOR_ACCOUNT_LABEL,
  type LeaguePlayerStatus,
  type VectorAccountState,
} from "@/features/leagues/lib/league-players";
import { cn } from "@/utils/cn";

function StatusCheckIcon() {
  return (
    <svg
      className="league-status-badge__check"
      width="14"
      height="14"
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
  );
}

export function LeagueStatusBadge({ status }: { status: LeaguePlayerStatus }) {
  const isActive = status === "active";

  return (
    <span
      className={cn(
        "league-status-badge",
        `league-status-badge--${status}`,
      )}
    >
      {isActive ? (
        <StatusCheckIcon />
      ) : (
        <span className="league-status-badge__dot" aria-hidden />
      )}
      {LEAGUE_PLAYER_STATUS_LABEL[status]}
    </span>
  );
}

export function VectorAccountStatus({
  state,
  iconOnly = false,
  showLabel = true,
}: {
  state: VectorAccountState;
  /** Favicon only (no check, no label) — e.g. player slide panel. */
  iconOnly?: boolean;
  /** When false, keep favicon but hide the “Vector Account” text. */
  showLabel?: boolean;
}) {
  if (state === "connected") {
    return (
      <span
        className={cn(
          "league-vector-status league-vector-status--connected",
          (iconOnly || !showLabel) && "league-vector-status--icon-only",
        )}
        aria-label={VECTOR_ACCOUNT_LABEL[state]}
        title={VECTOR_ACCOUNT_LABEL[state]}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="league-vector-status__icon"
        />
        {!iconOnly && showLabel ? (
          <span>{VECTOR_ACCOUNT_LABEL[state]}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "league-vector-status",
        `league-vector-status--${state}`,
      )}
    >
      {VECTOR_ACCOUNT_LABEL[state]}
    </span>
  );
}
