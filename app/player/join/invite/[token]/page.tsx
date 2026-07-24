"use client";

import { use } from "react";
import { PlayerAcceptInviteScreen } from "@/features/player-access/components/PlayerAcceptInviteScreen";

export default function PlayerInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <PlayerAcceptInviteScreen token={token} />;
}
