"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { communityFirstName } from "@/features/community/lib/community-name";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import {
  formatPreferredGame,
  formatMemberSince,
  formatSkillLevel,
  formatThrowingHand,
} from "@/features/profile/lib/profile-options";
import { createClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";
import {
  type CommunityPublicProfile,
  fetchCommunityProfile,
} from "@/lib/supabase/queries/community-profile";
import {
  cancelFriendRequest,
  fetchFriendshipStatus,
  type FriendshipStatus,
  requestFriend,
  respondFriendRequest,
} from "@/lib/supabase/queries/friends";
import type { PreferredGame, SkillLevel, ThrowingHand } from "@/types/profile";

interface CommunityPlayerPreviewSheetProps {
  open: boolean;
  userId: string | null;
  initialProfile?: CommunityPublicProfile | null;
  onClose: () => void;
}

function formatAverage(value: number) {
  if (value <= 0) {
    return "—";
  }
  return value.toFixed(1);
}

function formatPercent(value: number) {
  if (value <= 0) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function formatRecord(wins: number, played: number) {
  if (played <= 0) {
    return "—";
  }
  const losses = Math.max(played - wins, 0);
  return `${wins}-${losses}`;
}

function friendActionLabel(status: FriendshipStatus | null): string {
  switch (status) {
    case "friends":
      return "Friends";
    case "pending_outgoing":
      return "Requested";
    case "pending_incoming":
      return "Accept request";
    default:
      return "Add Friend";
  }
}

export function CommunityPlayerPreviewSheet({
  open,
  userId,
  initialProfile = null,
  onClose,
}: CommunityPlayerPreviewSheetProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CommunityPublicProfile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus | null>(null);
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    setProfile(initialProfile);
    setError(null);
    setFriendStatus(null);
    setFriendError(null);

    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setLoading(true);
    void fetchCommunityProfile(supabase, userId)
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load profile.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    if (user?.id) {
      void fetchFriendshipStatus(supabase, userId)
        .then((status) => {
          if (!cancelled) {
            setFriendStatus(status);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFriendStatus(null);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [initialProfile, open, user?.id, userId]);

  const firstName = communityFirstName(profile?.displayName);
  const joined = formatMemberSince(profile?.memberSince);
  const skill = formatSkillLevel(profile?.skillLevel as SkillLevel | null);
  const preferred = formatPreferredGame(profile?.preferredGame as PreferredGame | null);
  const hand = formatThrowingHand(profile?.throwingHand as ThrowingHand | null);
  const isSelf = Boolean(user?.id && userId && user.id === userId);
  const showFriendActions = Boolean(user?.id) && Boolean(userId) && !isSelf;
  const effectiveFriendStatus = isSelf ? "self" : friendStatus;

  const aboutBits = [skill, preferred, hand, profile?.homeLeague].filter(Boolean);

  const handleFriendAction = async () => {
    if (!userId || friendBusy || !effectiveFriendStatus || effectiveFriendStatus === "self") {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setFriendError("Supabase is not configured.");
      return;
    }

    setFriendBusy(true);
    setFriendError(null);
    try {
      let next: FriendshipStatus;
      if (effectiveFriendStatus === "none") {
        next = await requestFriend(supabase, userId);
      } else if (effectiveFriendStatus === "pending_outgoing") {
        next = await cancelFriendRequest(supabase, userId);
      } else if (effectiveFriendStatus === "pending_incoming") {
        next = await respondFriendRequest(supabase, userId, true);
      } else {
        next = effectiveFriendStatus;
      }
      setFriendStatus(next);
    } catch (caught) {
      setFriendError(formatSupabaseError(caught));
    } finally {
      setFriendBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Player profile"
      onClose={onClose}
      className="community-player-sheet"
    >
      <div className="community-player-sheet__body">
        {loading && !profile ? (
          <p className="community-player-sheet__status">Loading profile…</p>
        ) : null}
        {error ? <p className="community-player-sheet__error">{error}</p> : null}

        {profile ? (
          <>
            <div className="community-player-sheet__hero">
              <div className="community-player-sheet__avatar-wrap">
                <span className="community-player-sheet__avatar" aria-hidden>
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt="" />
                  ) : (
                    <HomeRecentMatchDartboard className="community-player-sheet__dartboard" />
                  )}
                </span>
                <CountryFlag
                  countryCode={profile.countryCode}
                  className="community-player-sheet__flag"
                  size={22}
                />
              </div>
              <div className="community-player-sheet__identity">
                <h4 className="community-player-sheet__name">{firstName}</h4>
                {profile.nickname ? (
                  <p className="community-player-sheet__nickname">
                    &ldquo;{profile.nickname}&rdquo;
                  </p>
                ) : null}
                {joined ? (
                  <p className="community-player-sheet__joined">Joined {joined}</p>
                ) : null}
              </div>
            </div>

            {aboutBits.length > 0 ? (
              <p className="community-player-sheet__about">{aboutBits.join(" · ")}</p>
            ) : null}

            {showFriendActions ? (
              <div className="community-player-sheet__friend">
                <TouchButton
                  type="button"
                  className={
                    effectiveFriendStatus === "friends"
                      ? "community-player-sheet__friend-btn is-friends"
                      : effectiveFriendStatus === "pending_outgoing"
                        ? "community-player-sheet__friend-btn is-pending"
                        : "community-player-sheet__friend-btn"
                  }
                  size="md"
                  fullWidth
                  variant={
                    effectiveFriendStatus === "none" ||
                    effectiveFriendStatus === "pending_incoming" ||
                    effectiveFriendStatus == null
                      ? "primary"
                      : "secondary"
                  }
                  disabled={
                    friendBusy ||
                    effectiveFriendStatus === "friends" ||
                    effectiveFriendStatus == null
                  }
                  onClick={() => void handleFriendAction()}
                >
                  {friendBusy || effectiveFriendStatus == null
                    ? "…"
                    : friendActionLabel(effectiveFriendStatus)}
                </TouchButton>
                {effectiveFriendStatus === "pending_outgoing" ? (
                  <p className="community-player-sheet__friend-hint">
                    Tap again to cancel your request.
                  </p>
                ) : null}
                {friendError ? (
                  <p className="community-player-sheet__error">{friendError}</p>
                ) : null}
              </div>
            ) : null}

            <div className="community-player-sheet__stats">
              <div className="community-player-sheet__stat">
                <span className="community-player-sheet__stat-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                </span>
                <span className="community-player-sheet__stat-copy">
                  <span className="community-player-sheet__stat-value">
                    {formatAverage(profile.threeDartAverage)}
                  </span>
                  <span className="community-player-sheet__stat-label">3-Dart Avg</span>
                </span>
              </div>
              <div className="community-player-sheet__stat">
                <span className="community-player-sheet__stat-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 7 10 17l-5-5" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>
                <span className="community-player-sheet__stat-copy">
                  <span className="community-player-sheet__stat-value">
                    {formatPercent(profile.checkoutPercent)}
                  </span>
                  <span className="community-player-sheet__stat-label">Checkout %</span>
                </span>
              </div>
              <div className="community-player-sheet__stat">
                <span className="community-player-sheet__stat-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                    <path d="M17 4h2a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4" />
                    <path d="M7 4H5a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4" />
                  </svg>
                </span>
                <span className="community-player-sheet__stat-copy">
                  <span className="community-player-sheet__stat-value">
                    {profile.highestCheckout > 0 ? profile.highestCheckout : "—"}
                  </span>
                  <span className="community-player-sheet__stat-label">High Finish</span>
                </span>
              </div>
              <div className="community-player-sheet__stat">
                <span className="community-player-sheet__stat-icon" aria-hidden>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 17 9 11l4 4 7-8" />
                    <path d="M14 7h6v6" />
                  </svg>
                </span>
                <span className="community-player-sheet__stat-copy">
                  <span className="community-player-sheet__stat-value">
                    {formatRecord(profile.matchesWon, profile.matchesPlayed)}
                  </span>
                  <span className="community-player-sheet__stat-label">Record</span>
                </span>
              </div>
            </div>

            {profile.matchesPlayed <= 0 && profile.threeDartAverage <= 0 ? (
              <section className="community-player-sheet__history" aria-label="Match history">
                <div className="community-player-sheet__history-header">
                  <h5 className="community-player-sheet__history-title">Match history</h5>
                </div>
                <p className="community-player-sheet__history-empty">
                  No matches yet. Play a match to track results.
                </p>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </BottomSheet>
  );
}
