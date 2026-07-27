"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { LeaguePlayerDirectoryHit } from "@/features/leagues/lib/league-players";
import { createClient } from "@/lib/supabase/client";
import { notifyCommunityRoomInvite } from "@/lib/supabase/queries/community-invites";
import { fetchCommunityProfile } from "@/lib/supabase/queries/community-profile";
import { searchVectorProfiles } from "@/lib/supabase/queries/league-players";

interface CommunityShareRoomSheetProps {
  open: boolean;
  roomId: string;
  roomCode: string;
  onClose: () => void;
}

type CommunityInviteSearchHit = LeaguePlayerDirectoryHit & {
  threeDartAverage: number;
};

export function CommunityShareRoomSheet({
  open,
  roomId,
  roomCode,
  onClose,
}: CommunityShareRoomSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommunityInviteSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const wasOpenRef = useRef(false);

  const runSearch = useEffectEvent(async (nextQuery: string) => {
    const requestId = ++requestIdRef.current;
    const trimmed = nextQuery.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setResults([]);
        return;
      }
      const hits = (await searchVectorProfiles(supabase, trimmed, 20)).filter(
        (hit) => hit.kind === "vector-user",
      );
      const enriched = await Promise.all(
        hits.map(async (hit) => {
          try {
            const profile = await fetchCommunityProfile(supabase, hit.id);
            return {
              ...hit,
              threeDartAverage: profile?.threeDartAverage ?? 0,
            };
          } catch {
            return { ...hit, threeDartAverage: 0 };
          }
        }),
      );
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResults(enriched);
    } catch (caught) {
      console.error("Community share search failed", caught);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
      }
    }
  });

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        setQuery("");
        setResults([]);
        setStatus(null);
        setError(null);
        setSearching(false);
        setSendingUserId(null);
      }
      return;
    }

    wasOpenRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void runSearch(query);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  const sendInvite = async (hit: CommunityInviteSearchHit) => {
    if (hit.kind !== "vector-user" || sendingUserId) {
      return;
    }

    const name = `${hit.firstName} ${hit.lastName}`.trim();
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSendingUserId(hit.id);
    setError(null);
    setStatus(null);

    try {
      await notifyCommunityRoomInvite(supabase, {
        roomId,
        profileUserId: hit.id,
      });
      setStatus(`Invite sent to ${name}.`);
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String((caught as { message?: string }).message ?? "")
          : "";
      setError(message || `Unable to invite ${name}.`);
    } finally {
      setSendingUserId(null);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Invite a player"
      onClose={onClose}
      className="community-share-sheet"
    >
      <div className="community-share-sheet__body">
        <div className="community-share-sheet__code-block">
          <p className="community-share-sheet__code-label">Room code</p>
          <p className="community-share-sheet__code">{roomCode}</p>
        </div>
        <p className="community-share-sheet__lede">
          Search for a Vector player and send them an in-app invite with this code.
        </p>

        <label className="community-share-sheet__search">
          <span className="sr-only">Search players</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Vector players"
            autoFocus
          />
        </label>

        {status ? <p className="community-share-sheet__status">{status}</p> : null}
        {error ? <p className="community-share-sheet__error">{error}</p> : null}

        <div className="community-share-sheet__results">
          {searching ? (
            <p className="community-share-sheet__empty">Searching…</p>
          ) : results.length === 0 ? (
            <p className="community-share-sheet__empty">
              {query.trim().length >= 2
                ? "No matching players."
                : "Search for a player to send an invite."}
            </p>
          ) : (
            <ul className="community-share-sheet__result-list">
              {results.map((hit) => {
                const name = `${hit.firstName} ${hit.lastName}`.trim();
                const sending = sendingUserId === hit.id;
                return (
                  <li key={`${hit.kind}:${hit.id}`}>
                    <div className="community-share-sheet__result">
                      <PlayerAvatar
                        name={name}
                        color={hit.color}
                        avatarUrl={hit.avatarUrl}
                        size="sm"
                      />
                      <span className="community-share-sheet__result-copy">
                        <strong>{name}</strong>
                        <span className="community-share-sheet__result-avg">
                          {hit.threeDartAverage > 0 ? (
                            <>
                              3-dart avg{" "}
                              <span className="community-share-sheet__result-avg-value">
                                {hit.threeDartAverage.toFixed(1)}
                              </span>
                            </>
                          ) : (
                            "No avg yet"
                          )}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="community-share-sheet__send"
                        disabled={Boolean(sendingUserId)}
                        onClick={() => void sendInvite(hit)}
                      >
                        {sending ? "Sending…" : "Invite"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
