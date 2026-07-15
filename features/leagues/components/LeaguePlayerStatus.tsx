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

export function VectorAccountStatus({ state }: { state: VectorAccountState }) {
  if (state === "connected") {
    return (
      <span className="league-vector-status league-vector-status--connected">
        <span className="league-vector-status__check" aria-hidden>
          ✓
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt=""
          className="league-vector-status__icon"
        />
        <span>{VECTOR_ACCOUNT_LABEL[state]}</span>
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
