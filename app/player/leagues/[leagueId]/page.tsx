"use client";

import { Suspense, use } from "react";
import { PlayerLeagueDetailScreen } from "@/features/player-access/components/PlayerLeagueDetailScreen";

function PlayerLeaguePageBody({ leagueId }: { leagueId: string }) {
  return <PlayerLeagueDetailScreen leagueId={leagueId} />;
}

export default function PlayerLeaguePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = use(params);

  return (
    <Suspense fallback={null}>
      <PlayerLeaguePageBody leagueId={leagueId} />
    </Suspense>
  );
}
