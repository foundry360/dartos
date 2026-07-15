"use client";

import {
  formatLeagueScheduleStatusLabel,
  type LeagueScheduleStatus,
} from "@/features/leagues/lib/league-formats";
import { cn } from "@/utils/cn";

export function LeagueScheduleStatusBadge({
  status,
}: {
  status: LeagueScheduleStatus;
}) {
  if (status === "unknown") {
    return (
      <span className="league-schedule-status league-schedule-status--unknown">
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "league-schedule-status",
        `league-schedule-status--${status}`,
      )}
    >
      <span className="league-schedule-status__dot" aria-hidden />
      {formatLeagueScheduleStatusLabel(status)}
    </span>
  );
}
