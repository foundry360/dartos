import {
  LEAGUE_NIGHT_MATCH_STATUS_LABEL,
  type LeagueNightMatchUiStatus,
} from "@/features/leagues/lib/league-night";
import { cn } from "@/utils/cn";

export function LeagueMatchStatusBadge({
  status,
  className,
}: {
  status: LeagueNightMatchUiStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "league-night-match-badge",
        `league-night-match-badge--${status}`,
        className,
      )}
    >
      {LEAGUE_NIGHT_MATCH_STATUS_LABEL[status]}
    </span>
  );
}
