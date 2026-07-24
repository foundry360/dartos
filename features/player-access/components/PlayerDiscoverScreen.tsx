"use client";

import { useCallback, useEffect, useState } from "react";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { createClient } from "@/lib/supabase/client";
import {
  requestLeagueRegistration,
  searchJoinableLeagues,
  type JoinableLeague,
} from "@/lib/supabase/queries/player-league-access";
import { playerLeaguePath } from "@/lib/auth/routes";
import { useRouter } from "next/navigation";
import "@/features/player-access/player-access.css";

export function PlayerDiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [leagues, setLeagues] = useState<JoinableLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await searchJoinableLeagues(supabase, search);
      setLeagues(rows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to search leagues.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const handleRegister = async (league: JoinableLeague) => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setBusyId(league.id);
    setError(null);

    try {
      await requestLeagueRegistration(supabase, league.id);
      if (league.registration_mode === "open") {
        router.push(playerLeaguePath(league.id));
      } else {
        setError(null);
        await load(query);
        setError("Registration requested. Waiting for director approval.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to register.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PlayerAppShell title="Discover" className="shell-page">
      <div className="league-play-screen">
        <input
          className="player-discover__search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leagues or venues"
          aria-label="Search leagues"
        />

        {error ? <p className="league-play-screen__empty">{error}</p> : null}
        {loading ? <p className="league-play-screen__empty">Searching…</p> : null}

        {!loading && leagues.length === 0 ? (
          <p className="league-play-screen__empty">No joinable leagues found.</p>
        ) : (
          <div className="player-discover__list">
            {leagues.map((league) => (
              <article key={league.id} className="player-discover__card">
                <h2>{league.name}</h2>
                <p>
                  {league.organization_name}
                  {league.registration_mode === "open"
                    ? " · Open registration"
                    : " · Request to join"}
                </p>
                <button
                  type="button"
                  className="player-home__action player-home__action--primary"
                  disabled={busyId === league.id}
                  onClick={() => void handleRegister(league)}
                >
                  {busyId === league.id
                    ? "Working…"
                    : league.registration_mode === "open"
                      ? "Register"
                      : "Request to join"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </PlayerAppShell>
  );
}
