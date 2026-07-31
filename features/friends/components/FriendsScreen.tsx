"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { communityFirstName } from "@/features/community/lib/community-name";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  type FriendRequestRow,
  type FriendRow,
  listFriends,
  listPendingFriendRequests,
  respondFriendRequest,
} from "@/lib/supabase/queries/friends";
import "@/features/friends/friends.css";

function displayLabel(displayName: string | null, nickname: string | null) {
  const first = communityFirstName(displayName);
  if (first) {
    return first;
  }
  if (nickname?.trim()) {
    return nickname.trim();
  }
  return "Player";
}

export function FriendsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<FriendRequestRow[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user?.id) {
      setRequests([]);
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextRequests, nextFriends] = await Promise.all([
        listPendingFriendRequests(supabase),
        listFriends(supabase),
      ]);
      setRequests(nextRequests);
      setFriends(nextFriends);
    } catch (caught) {
      setError(formatSupabaseError(caught));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void reload();
  }, [authLoading, reload]);

  const handleRespond = async (requesterId: string, accept: boolean) => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusyId(requesterId);
    setError(null);
    try {
      await respondFriendRequest(supabase, requesterId, accept);
      await reload();
    } catch (caught) {
      setError(formatSupabaseError(caught));
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return <p className="friends-page__status">Loading…</p>;
  }

  if (!user) {
    return <p className="friends-page__status">Sign in to manage friends.</p>;
  }

  return (
    <div className="friends-page">
      {error ? <p className="friends-page__error">{error}</p> : null}

      <section className="friends-page__section" aria-labelledby="friends-requests-heading">
        <h2 id="friends-requests-heading" className="friends-page__heading">
          Requests
        </h2>
        {loading && requests.length === 0 ? (
          <p className="friends-page__status">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="friends-page__empty">No pending friend requests.</p>
        ) : (
          <ul className="friends-page__list">
            {requests.map((request) => {
              const name = displayLabel(request.displayName, request.nickname);
              const busy = busyId === request.requesterId;
              return (
                <li key={request.requesterId} className="friends-page__row">
                  <div className="friends-page__person">
                    <span className="friends-page__avatar" aria-hidden>
                      {request.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={request.avatarUrl} alt="" />
                      ) : (
                        <HomeRecentMatchDartboard className="friends-page__dartboard" />
                      )}
                    </span>
                    <CountryFlag
                      countryCode={request.countryCode}
                      className="friends-page__flag"
                      size={18}
                    />
                    <div className="friends-page__identity">
                      <span className="friends-page__name">{name}</span>
                      {request.nickname ? (
                        <span className="friends-page__meta">&ldquo;{request.nickname}&rdquo;</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="friends-page__actions">
                    <button
                      type="button"
                      className="friends-page__btn friends-page__btn--accept"
                      disabled={busy}
                      onClick={() => void handleRespond(request.requesterId, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="friends-page__btn friends-page__btn--decline"
                      disabled={busy}
                      onClick={() => void handleRespond(request.requesterId, false)}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="friends-page__section" aria-labelledby="friends-list-heading">
        <h2 id="friends-list-heading" className="friends-page__heading">
          Friends
        </h2>
        {loading && friends.length === 0 ? (
          <p className="friends-page__status">Loading friends…</p>
        ) : friends.length === 0 ? (
          <p className="friends-page__empty">
            No friends yet. Open a player profile in Community and tap Add Friend.
          </p>
        ) : (
          <ul className="friends-page__list">
            {friends.map((friend) => {
              const name = displayLabel(friend.displayName, friend.nickname);
              return (
                <li key={friend.friendId} className="friends-page__row friends-page__row--static">
                  <div className="friends-page__person">
                    <span className="friends-page__avatar" aria-hidden>
                      {friend.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={friend.avatarUrl} alt="" />
                      ) : (
                        <HomeRecentMatchDartboard className="friends-page__dartboard" />
                      )}
                    </span>
                    <CountryFlag
                      countryCode={friend.countryCode}
                      className="friends-page__flag"
                      size={18}
                    />
                    <div className="friends-page__identity">
                      <span className="friends-page__name">{name}</span>
                      {friend.nickname ? (
                        <span className="friends-page__meta">&ldquo;{friend.nickname}&rdquo;</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
