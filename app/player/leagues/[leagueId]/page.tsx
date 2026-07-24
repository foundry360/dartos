"use client";

import { use } from "react";
import { PlayerLeagueDetailScreen } from "@/features/player-access/components/PlayerLeagueDetailScreen";

export default function PlayerLeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = use(params);
  return <PlayerLeagueDetailScreen leagueId={leagueId} />;
}
