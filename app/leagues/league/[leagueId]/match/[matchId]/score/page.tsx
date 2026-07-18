"use client";

import { useParams } from "next/navigation";
import { LeagueX01ScoringScreen } from "@/features/leagues/components/LeagueX01ScoringScreen";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import { isTeamStyleLeagueFormat } from "@/features/leagues/lib/league-game-rules";

export default function LeagueMatchScorePage() {
  const params = useParams<{ leagueId: string }>();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const { league: leagueEntry } = useLeagueDetail(leagueId);
  const variant = isTeamStyleLeagueFormat(leagueEntry?.league.format)
    ? "team"
    : "singles";

  // Keep a single screen instance so Game On does not re-announce when format
  // resolves from loading → team (swapping Singles/Team wrappers remounted the hook).
  return <LeagueX01ScoringScreen variant={variant} />;
}
