"use client";

import {
  LEAGUE_PLAYER_STATUS_LABEL,
  VECTOR_ACCOUNT_LABEL,
  type LeaguePlayerStatus,
  type VectorAccountState,
} from "@/features/leagues/lib/league-players";
import { cn } from "@/utils/cn";

export function LeagueStatusBadge({ status }: { status: LeaguePlayerStatus }) {
  return (
    <span
      className={cn(
        "league-status-badge",
        `league-status-badge--${status}`,
      )}
    >
      <span className="league-status-badge__dot" aria-hidden />
      {LEAGUE_PLAYER_STATUS_LABEL[status]}
    </span>
  );
}

export function VectorAccountStatus({
  state,
  iconOnly = false,
}: {
  state: VectorAccountState;
  iconOnly?: boolean;
}) {
  if (state === "connected") {
    return (
      <span
        className={cn(
          "league-vector-status league-vector-status--connected",
          iconOnly && "league-vector-status--icon-only",
        )}
        aria-label={VECTOR_ACCOUNT_LABEL[state]}
        title={VECTOR_ACCOUNT_LABEL[state]}
      >
        {!iconOnly ? (
          <span className="league-vector-status__check" aria-hidden>
            ✓
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="league-vector-status__icon"
        />
        {!iconOnly ? <span>{VECTOR_ACCOUNT_LABEL[state]}</span> : null}
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
