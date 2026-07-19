"use client";

import { useParams } from "next/navigation";
import { LeagueCricketScoringScreen } from "@/features/leagues/components/LeagueCricketScoringScreen";
import { LeagueX01ScoringScreen } from "@/features/leagues/components/LeagueX01ScoringScreen";
import { useLeagueDetail } from "@/features/leagues/hooks/useLeagueDetail";
import {
  getRulesFamilyForGameFormat,
  isTeamStyleLeagueFormat,
} from "@/features/leagues/lib/league-game-rules";

export default function LeagueMatchScorePage() {
  const params = useParams<{ leagueId: string }>();
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const { league: leagueEntry } = useLeagueDetail(leagueId);
  const variant = isTeamStyleLeagueFormat(leagueEntry?.league.format)
    ? "team"
    : "singles";
  const rulesFamily = getRulesFamilyForGameFormat(
    leagueEntry?.league.game_format,
  );

  // Keep a single screen instance so Game On does not re-announce when format
  // resolves from loading → team (swapping Singles/Team wrappers remounted the hook).
  if (rulesFamily === "cricket" || rulesFamily === "tactics") {
    return <LeagueCricketScoringScreen variant={variant} />;
  }

  return <LeagueX01ScoringScreen variant={variant} />;
}
