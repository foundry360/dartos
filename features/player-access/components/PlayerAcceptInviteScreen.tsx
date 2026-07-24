"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { PLAYER_HOME_PATH, playerLeaguePath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { acceptLeagueInvite } from "@/lib/supabase/queries/player-league-access";

export function PlayerAcceptInviteScreen({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    void (async () => {
      try {
        const leagueId = await acceptLeagueInvite(supabase, token);
        router.replace(playerLeaguePath(leagueId));
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to accept invite.");
      }
    })();
  }, [router, token]);

  return (
    <PlayerAppShell heading="Accept invite" backHref={PLAYER_HOME_PATH} className="shell-page">
      <p className="league-play-screen__empty">
        {error ?? "Accepting your league invitation…"}
      </p>
    </PlayerAppShell>
  );
}
