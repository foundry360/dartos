"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { playerLeaguePath, PLAYER_HOME_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { joinLeagueByCode } from "@/lib/supabase/queries/player-league-access";
import "@/features/player-access/player-access.css";

export function PlayerJoinCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const leagueId = await joinLeagueByCode(supabase, code);
      router.push(playerLeaguePath(leagueId));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to join with that code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PlayerAppShell title="Join code" backHref={PLAYER_HOME_PATH} className="shell-page">
      <form className="player-join__form" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="player-join-code">
          Enter the code from your league director
        </label>
        <input
          id="player-join-code"
          className="player-join__input"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="ABCD1234"
          autoComplete="off"
          required
          minLength={4}
          maxLength={12}
        />
        {error ? <p className="auth-screen__error">{error}</p> : null}
        <button
          type="submit"
          className="player-home__action player-home__action--primary"
          disabled={submitting}
        >
          {submitting ? "Joining…" : "Join league"}
        </button>
      </form>
    </PlayerAppShell>
  );
}
