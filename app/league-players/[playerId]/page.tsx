"use client";

import { useParams } from "next/navigation";
import { LeagueMemberProfileCardScreen } from "@/features/leagues/components/LeagueMemberProfileCardScreen";
import { normalizeLeagueMemberCardId } from "@/features/leagues/lib/league-member-profile-card";

export default function LeaguePlayerCardPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = normalizeLeagueMemberCardId(
    typeof params.playerId === "string" ? params.playerId : "",
  );

  return <LeagueMemberProfileCardScreen playerId={playerId} />;
}
