"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MyLeagueCard } from "@/features/leagues/components/MyLeagueCard";
import { useMyRegisteredLeagues } from "@/features/leagues/hooks/useMyRegisteredLeagues";
import { getPlayerLeagueStatus } from "@/features/leagues/lib/league-formats";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import { PLAYER_DISCOVER_PATH, playerLeaguePath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { joinLeagueByCode } from "@/lib/supabase/queries/player-league-access";
import "@/features/leagues/league-play.css";
import "@/features/player-access/player-access.css";

export function PlayerHomeScreen() {
  const router = useRouter();
  const { leagues, loading, error, refresh } = useMyRegisteredLeagues();
  const [tab] = useState<"leagues">("leagues");
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const { upcoming, completed } = useMemo(() => {
    const nextUpcoming: LeagueWithVenue[] = [];
    const nextCompleted: LeagueWithVenue[] = [];

    for (const entry of leagues) {
      if (getPlayerLeagueStatus(entry.league) === "completed") {
        nextCompleted.push(entry);
      } else {
        nextUpcoming.push(entry);
      }
    }

    return { upcoming: nextUpcoming, completed: nextCompleted };
  }, [leagues]);

  const closeJoinSheet = () => {
    setJoinSheetOpen(false);
    setCode("");
    setJoinError(null);
    setJoining(false);
  };

  const handleJoinByCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setJoinError("Supabase is not configured.");
      return;
    }

    setJoining(true);
    setJoinError(null);

    try {
      const leagueId = await joinLeagueByCode(supabase, code);
      closeJoinSheet();
      await refresh();
      router.push(playerLeaguePath(leagueId));
      router.refresh();
    } catch (caught) {
      setJoinError(
        caught instanceof Error ? caught.message : "Unable to join with that code.",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <PlayerAppShell title="My Leagues" className="shell-page league-play-page">
      <div className="league-play-screen">
        <div className="player-home__actions">
          <Link href={PLAYER_DISCOVER_PATH} className="player-home__action player-home__action--primary">
            Discover leagues
          </Link>
          <button
            type="button"
            className="player-home__action player-home__action--primary"
            onClick={() => {
              setJoinError(null);
              setJoinSheetOpen(true);
            }}
          >
            Enter join code
          </button>
        </div>

        {loading ? (
          <p className="league-play-screen__empty">Loading your leagues…</p>
        ) : error ? (
          <p className="league-play-screen__empty">{error}</p>
        ) : tab === "leagues" ? (
          <>
            <GlassPanel className="my-league-section-card">
              <section className="my-league-section">
                <h2 className="my-league-section__heading">Upcoming / active</h2>
                {upcoming.length > 0 ? (
                  <div className="my-league-list">
                    {upcoming.map((entry) => (
                      <MyLeagueCard
                        key={entry.league.id}
                        entry={entry}
                        href={playerLeaguePath(entry.league.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="my-league-section__empty">
                    No leagues yet. Discover one or enter a join code from your director.
                  </div>
                )}
              </section>
            </GlassPanel>

            {completed.length > 0 ? (
              <GlassPanel className="my-league-section-card">
                <section className="my-league-section">
                  <h2 className="my-league-section__heading">Completed</h2>
                  <div className="my-league-list">
                    {completed.map((entry) => (
                      <MyLeagueCard
                        key={entry.league.id}
                        entry={entry}
                        href={playerLeaguePath(entry.league.id)}
                      />
                    ))}
                  </div>
                </section>
              </GlassPanel>
            ) : null}
          </>
        ) : null}
      </div>

      <BottomSheet
        open={joinSheetOpen}
        title="Enter join code"
        onClose={closeJoinSheet}
        className="player-join-sheet"
        overlayClassName="player-join-sheet-overlay"
      >
        <form
          className="player-join__form"
          onSubmit={(event) => void handleJoinByCode(event)}
        >
          <p className="player-join__hint">
            Enter the code from your league director to join their roster.
          </p>
          <label className="player-join__label" htmlFor="player-home-join-code">
            Join code
          </label>
          <input
            id="player-home-join-code"
            className="player-join__input"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABCD1234"
            autoComplete="off"
            autoFocus
            required
            minLength={4}
            maxLength={12}
            disabled={joining}
          />
          {joinError ? <p className="auth-screen__error">{joinError}</p> : null}
          <button
            type="submit"
            className="player-home__action player-home__action--primary player-join__submit"
            disabled={joining || code.trim().length < 4}
          >
            {joining ? "Joining…" : "Join league"}
          </button>
        </form>
      </BottomSheet>
    </PlayerAppShell>
  );
}
