"use client";

import { Suspense, use } from "react";
import { PlayerLeagueDetailScreen } from "@/features/player-access/components/PlayerLeagueDetailScreen";

function MemberLeaguePageBody({ leagueId }: { leagueId: string }) {
  return <PlayerLeagueDetailScreen leagueId={leagueId} variant="member" />;
}

export default function MemberLeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = use(params);

  return (
    <Suspense fallback={null}>
      <MemberLeaguePageBody leagueId={leagueId} />
    </Suspense>
  );
}
