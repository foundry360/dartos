"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useLeagueMemberCards } from "@/features/leagues/hooks/useLeagueMemberCards";
import {
  toLeagueMemberListItem,
  type LeagueMemberListItem,
} from "@/features/leagues/lib/league-member-profile-card";
import {
  LEAGUE_PLAYER_CARD_RECENT_CHANGED_EVENT,
  readRecentLeaguePlayerCardIds,
} from "@/features/leagues/lib/league-player-card-recent-storage";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import {
  LEAGUE_PLAY_PATH,
  LOGIN_PATH,
  leaguePlayerCardPath,
} from "@/lib/auth/routes";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-member-profile-card.css";

const MOST_RECENT_LIMIT = 4;

function resolveMostRecentPlayers(
  recentIds: string[],
  players: LeagueMemberListItem[],
): LeagueMemberListItem[] {
  const byId = new Map(players.map((player) => [player.id, player]));

  return recentIds
    .map((id) => byId.get(id))
    .filter((player): player is LeagueMemberListItem => player != null)
    .slice(0, MOST_RECENT_LIMIT);
}

function matchesSearch(player: LeagueMemberListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    player.playerName.toLowerCase().includes(q) ||
    player.teamName.toLowerCase().includes(q) ||
    player.leagueName.toLowerCase().includes(q) ||
    player.role.toLowerCase().includes(q)
  );
}

function LeaguePlayerListHeader() {
  return (
    <div className="league-players-list__row league-players-list__row--header" aria-hidden>
      <span className="league-players-list__avatar-spacer" />
      <span className="league-players-list__name">Player</span>
      <span className="league-players-list__meta">Team</span>
      <span className="league-players-list__meta">Role</span>
      <span className="league-players-list__league">League</span>
      <span className="league-players-list__status">Status</span>
      <span className="league-players-list__record">Record</span>
      <span className="league-players-list__chevron" />
    </div>
  );
}

function LeaguePlayerListRow({ player }: { player: LeagueMemberListItem }) {
  return (
    <Link
      href={leaguePlayerCardPath(player.id)}
      className="league-players-list__row"
    >
      <PlayerAvatar
        name={player.playerName}
        color={player.avatarColor}
        avatarUrl={player.avatarUrl}
        size="sm"
        className="league-players-list__avatar"
      />
      <span className="league-players-list__name">{player.playerName}</span>
      <span className="league-players-list__meta">{player.teamName}</span>
      <span className="league-players-list__meta">{player.role}</span>
      <span className="league-players-list__league">{player.leagueName}</span>
      <span
        className={cn(
          "league-players-list__status",
          player.membershipStatus === "active"
            ? "league-players-list__status--active"
            : "league-players-list__status--inactive",
        )}
      >
        {player.membershipStatus === "active" ? "Active" : "Inactive"}
      </span>
      <span className="league-players-list__record">{player.recordLabel}</span>
      <span className="league-players-list__chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}

export function LeaguePlayersListScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { loading: accessLoading, allowed: canManageLeagues } =
    useLeagueManagementAccess();
  const { cards, loading: cardsLoading, error } = useLeagueMemberCards();
  const [search, setSearch] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const isSearching = search.trim().length > 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `${LOGIN_PATH}?next=${encodeURIComponent("/league-players")}`,
      );
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!authLoading && !accessLoading && user && !canManageLeagues) {
      router.replace(LEAGUE_PLAY_PATH);
    }
  }, [accessLoading, authLoading, canManageLeagues, router, user]);

  useEffect(() => {
    const syncRecent = () => {
      setRecentIds(readRecentLeaguePlayerCardIds());
    };

    syncRecent();
    window.addEventListener(LEAGUE_PLAYER_CARD_RECENT_CHANGED_EVENT, syncRecent);
    window.addEventListener("focus", syncRecent);
    window.addEventListener("storage", syncRecent);

    return () => {
      window.removeEventListener(
        LEAGUE_PLAYER_CARD_RECENT_CHANGED_EVENT,
        syncRecent,
      );
      window.removeEventListener("focus", syncRecent);
      window.removeEventListener("storage", syncRecent);
    };
  }, []);

  const listItems = useMemo(
    () => cards.map(toLeagueMemberListItem),
    [cards],
  );

  const mostRecent = useMemo(
    () => resolveMostRecentPlayers(recentIds, listItems),
    [listItems, recentIds],
  );

  const searchResults = useMemo(
    () => listItems.filter((player) => matchesSearch(player, search)),
    [listItems, search],
  );

  const players = isSearching ? searchResults : mostRecent;
  const heading = isSearching ? "Search results" : "Most Recent";
  const showPanel = isSearching || mostRecent.length > 0;
  const showLoading =
    authLoading || accessLoading || (cardsLoading && listItems.length === 0);

  if (showLoading || !user || !canManageLeagues) {
    return (
      <MobileAppShell
        title="Player Cards"
        className="settings-page shell-page league-players-list-page"
      >
        <div className="league-players-list">
          <p className="league-players-list__empty">Loading player cards…</p>
        </div>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell
      title="Player Cards"
      className="settings-page shell-page league-players-list-page"
    >
      <div className="league-players-list">
        <label className="league-players-list__search">
          <span className="sr-only">Search league players</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, team, or league"
            autoComplete="off"
          />
        </label>

        {error ? (
          <p className="league-players-list__empty" role="alert">
            {error}
          </p>
        ) : null}

        {showPanel ? (
          <GlassPanel className="league-players-list__panel">
            <h2 className="league-players-list__section-heading">{heading}</h2>

            {players.length === 0 ? (
              <p className="league-players-list__empty">
                No players match your search.
              </p>
            ) : (
              <div className="league-players-list__table">
                <LeaguePlayerListHeader />
                <ul className="league-players-list__rows">
                  {players.map((player) => (
                    <li key={player.id}>
                      <LeaguePlayerListRow player={player} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassPanel>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
