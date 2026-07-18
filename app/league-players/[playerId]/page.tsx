"use client";

import { useParams } from "next/navigation";
import { LeagueMemberProfileCardScreen } from "@/features/leagues/components/LeagueMemberProfileCardScreen";

export default function LeaguePlayerCardPage() {
  const params = useParams<{ playerId: string }>();
  const playerId = typeof params.playerId === "string" ? params.playerId : "";

  return <LeagueMemberProfileCardScreen playerId={playerId} />;
}
