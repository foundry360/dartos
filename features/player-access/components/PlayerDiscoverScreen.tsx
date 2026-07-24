"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MyLeagueCard } from "@/features/leagues/components/MyLeagueCard";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import { getDiscoverJoinState } from "@/features/player-access/lib/discover-join-state";
import { PLAYER_HOME_PATH, playerLeaguePath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import type { LeagueRow } from "@/lib/supabase/database.types";
import {
  requestLeagueRegistration,
  searchJoinableLeagues,
  type JoinableLeague,
} from "@/lib/supabase/queries/player-league-access";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import "@/features/leagues/league-play.css";
import "@/features/player-access/player-access.css";

function joinableToEntry(league: JoinableLeague): LeagueWithVenue {
  return {
    league: {
      id: league.id,
      organization_id: league.organization_id,
      season_id: null,
      name: league.name,
      slug: league.slug,
      description: league.description,
      format: league.format,
      competition_format: null,
      game_format: league.game_format,
      rules: null,
      max_players: league.max_players,
      starts_at: league.starts_at,
      ends_at: league.ends_at,
      published_at: league.published_at,
      join_code: null,
      registration_mode: league.registration_mode,
      created_by: "",
      created_at: league.published_at ?? "",
      updated_at: league.published_at ?? "",
    } as LeagueRow,
    organization: {
      id: league.organization_id,
      name: league.organization_name,
      slug: league.organization_id,
      board_count: 0,
    },
    season: null,
  };
}

function normalizeJoinableLeague(row: JoinableLeague): JoinableLeague {
  return {
    ...row,
    max_players: row.max_players ?? null,
    player_count: typeof row.player_count === "number" ? row.player_count : 0,
    membership_status: row.membership_status ?? null,
  };
}

export function PlayerDiscoverScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [leagues, setLeagues] = useState<JoinableLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { joinable, completed } = useMemo(() => {
    const nextJoinable: JoinableLeague[] = [];
    const nextCompleted: JoinableLeague[] = [];

    for (const league of leagues) {
      if (getDiscoverJoinState(league).statusTone === "completed") {
        nextCompleted.push(league);
      } else {
        nextJoinable.push(league);
      }
    }

    return { joinable: nextJoinable, completed: nextCompleted };
  }, [leagues]);

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
      setLeagues(rows.map(normalizeJoinableLeague));
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
    const joinState = getDiscoverJoinState(league);
    if (!joinState.canJoin) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    setBusyId(league.id);
    setError(null);
    setMessage(null);

    try {
      await requestLeagueRegistration(supabase, league.id);
      if (league.registration_mode === "open") {
        router.push(playerLeaguePath(league.id));
      } else {
        await load(query);
        setMessage("Registration requested. Waiting for director approval.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to register.");
    } finally {
      setBusyId(null);
    }
  };

  const renderCard = (league: JoinableLeague) => {
    const joinState = getDiscoverJoinState(league);
    const busy = busyId === league.id;

    if (joinState.canView) {
      return (
        <MyLeagueCard
          key={league.id}
          entry={joinableToEntry(league)}
          href={`${playerLeaguePath(league.id)}?from=discover`}
          statusLabel={joinState.statusLabel}
          statusTone={joinState.statusTone}
          ctaLabel={joinState.ctaLabel}
        />
      );
    }

    return (
      <MyLeagueCard
        key={league.id}
        entry={joinableToEntry(league)}
        statusLabel={joinState.statusLabel}
        statusTone={joinState.statusTone}
        ctaLabel={busy ? "Working…" : joinState.ctaLabel}
        ctaDisabled={busy || !joinState.canJoin}
        onCtaClick={() => void handleRegister(league)}
      />
    );
  };

  return (
    <PlayerAppShell heading="Discover leagues" backHref={PLAYER_HOME_PATH} className="shell-page">
      <div className="league-play-screen">
        <input
          className="player-discover__search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search leagues or venues"
          aria-label="Search leagues"
        />

        {error ? <p className="league-play-screen__empty">{error}</p> : null}
        {message ? <p className="league-play-screen__empty">{message}</p> : null}
        {loading ? <p className="league-play-screen__empty">Searching…</p> : null}

        {!loading && joinable.length === 0 && completed.length === 0 ? (
          <p className="league-play-screen__empty">No joinable leagues found.</p>
        ) : null}

        {!loading && joinable.length > 0 ? (
          <GlassPanel className="my-league-section-card">
            <section className="my-league-section">
              <h2 className="my-league-section__heading">Joinable leagues</h2>
              <div className="my-league-list">{joinable.map(renderCard)}</div>
            </section>
          </GlassPanel>
        ) : null}

        {!loading && completed.length > 0 ? (
          <GlassPanel className="my-league-section-card">
            <section className="my-league-section">
              <h2 className="my-league-section__heading">Completed</h2>
              <div className="my-league-list">{completed.map(renderCard)}</div>
            </section>
          </GlassPanel>
        ) : null}
      </div>
    </PlayerAppShell>
  );
}
