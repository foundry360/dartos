import { PlayerDiscoverScreen } from "@/features/player-access/components/PlayerDiscoverScreen";

/** Paid Club/Elite discover — middleware blocks members from /player/discover. */
export default function LeagueDiscoverPage() {
  return <PlayerDiscoverScreen variant="member" />;
}
