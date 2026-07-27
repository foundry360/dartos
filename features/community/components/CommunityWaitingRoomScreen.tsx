"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TouchButton } from "@/components/ui/TouchButton";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { CommunityPlayerPreviewSheet } from "@/features/community/components/CommunityPlayerPreviewSheet";
import { useCommunityRoom } from "@/features/community/hooks/useCommunityRoom";
import {
  communityMatchFormatLabel,
  communityMatchGameLabel,
} from "@/features/community/lib/community-match-config";
import { communityFirstName } from "@/features/community/lib/community-name";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import { useProfileStore } from "@/features/profile/store/profile-store";
import {
  getThreeDartAverage,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";
import { LOGIN_PATH } from "@/lib/auth/routes";
import type { CommunityPublicProfile } from "@/lib/supabase/queries/community-profile";
import { cn } from "@/utils/cn";
import { isIPhoneDevice } from "@/utils/fullscreen";
import "@/features/community/community.css";

const MATCH_START_TIMEOUT_MS = 10 * 60 * 1000;

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function WaitingSeat({
  profile,
  fallbackName,
  roleLabel,
  onSelect,
}: {
  profile: CommunityPublicProfile | null;
  fallbackName: string;
  roleLabel: string;
  onSelect?: () => void;
}) {
  const name = communityFirstName(profile?.displayName, fallbackName);
  const average = profile?.threeDartAverage ?? 0;
  const content = (
    <>
      <span className="community-waiting__avatar" aria-hidden>
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" />
        ) : (
          <HomeRecentMatchDartboard className="community-waiting__dartboard" />
        )}
      </span>
      <span className="community-waiting__seat-copy">
        <span className="community-waiting__seat-role-row">
          <span className="community-waiting__seat-role">{roleLabel}</span>
          <CountryFlag
            countryCode={profile?.countryCode}
            className="community-waiting__flag"
            size={16}
          />
        </span>
        <span className="community-waiting__seat-name">{name}</span>
        <span className="community-waiting__seat-avg">
          {average > 0 ? (
            <>
              3-dart avg{" "}
              <span className="community-waiting__seat-avg-value">{average.toFixed(1)}</span>
            </>
          ) : (
            "No avg yet"
          )}
        </span>
      </span>
    </>
  );

  if (!onSelect) {
    return <div className="community-waiting__seat">{content}</div>;
  }

  return (
    <button type="button" className="community-waiting__seat" onClick={onSelect}>
      {content}
    </button>
  );
}

export function CommunityWaitingRoomScreen() {
  const router = useRouter();
  const {
    user,
    room,
    members,
    profilesByUserId,
    loading,
    busy,
    error,
    leaveRoom,
    closeRoomNow,
    startMatch,
  } = useCommunityRoom();

  const profileDisplayName = useProfileStore((state) => state.displayName);
  const profileNickname = useProfileStore((state) => state.nickname);
  const profileAvatarUrl = useProfileStore((state) => state.avatarUrl);
  const profileCountryCode = useProfileStore((state) => state.countryCode);
  const stats = useStatisticsStore((state) => state.stats);

  const [isIPhone, setIsIPhone] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [closingSecondsLeft, setClosingSecondsLeft] = useState<number | null>(null);
  const [startSecondsLeft, setStartSecondsLeft] = useState<number | null>(null);
  const autoClosedForClosingAtRef = useRef<string | null>(null);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  const seatCount = members.filter((member) => member.seat != null).length;
  const isHosting = Boolean(user && room && room.hostId === user.id);
  const isGuest = Boolean(user && room && room.hostId !== user.id);
  const inWaitingRoom = Boolean(room && room.status === "lobby" && seatCount >= 2);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      return;
    }
    if (!room || room.status === "ended") {
      router.replace("/community");
      return;
    }
    if (room.status === "playing") {
      router.replace("/community/match");
      return;
    }
    if (room.status === "lobby" && seatCount < 2) {
      router.replace("/community");
    }
  }, [loading, room, router, seatCount, user]);

  const roomClosingAt = room?.closingAt ?? null;
  const guestJoinedAt =
    members.find((member) => member.seat === 1)?.joinedAt ?? null;
  // Prefer server matched_at; fall back to opponent join time if migration isn't live yet.
  const startAnchorAt = room?.matchedAt ?? guestJoinedAt;

  // 10-minute host-start countdown from when the opponent joined.
  useEffect(() => {
    if (!inWaitingRoom) {
      setStartSecondsLeft(null);
      return;
    }

    const anchorMs = startAnchorAt
      ? new Date(startAnchorAt).getTime()
      : Date.now();
    if (!Number.isFinite(anchorMs)) {
      setStartSecondsLeft(null);
      return;
    }

    const deadlineMs = anchorMs + MATCH_START_TIMEOUT_MS;

    const tick = () => {
      setStartSecondsLeft(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)));
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [inWaitingRoom, startAnchorAt]);

  useEffect(() => {
    if (!isGuest || !roomClosingAt) {
      setClosingSecondsLeft(null);
      autoClosedForClosingAtRef.current = null;
      return;
    }

    const closingMs = new Date(roomClosingAt).getTime();
    if (!Number.isFinite(closingMs)) {
      setClosingSecondsLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((closingMs - Date.now()) / 1000));
      setClosingSecondsLeft(remaining);
      if (remaining <= 0 && autoClosedForClosingAtRef.current !== roomClosingAt) {
        autoClosedForClosingAtRef.current = roomClosingAt;
        void closeRoomNow().then(() => router.replace("/community"));
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [closeRoomNow, isGuest, roomClosingAt, router]);

  const hostMember = members.find((member) => member.seat === 0) ?? null;
  const guestMember = members.find((member) => member.seat === 1) ?? null;

  const hostProfile = useMemo(() => {
    if (!room) {
      return null;
    }
    const fromMap = profilesByUserId[hostMember?.userId ?? room.hostId] ?? null;
    if (fromMap) {
      return fromMap;
    }
    if (isHosting && user) {
      return {
        id: user.id,
        displayName: profileDisplayName,
        nickname: profileNickname,
        avatarUrl: profileAvatarUrl,
        countryCode: profileCountryCode,
        threeDartAverage: getThreeDartAverage(stats),
        skillLevel: null,
        preferredGame: null,
        throwingHand: null,
        homeLeague: null,
        memberSince: null,
        checkoutPercent: 0,
        highestCheckout: 0,
        matchesWon: 0,
        matchesPlayed: 0,
      } satisfies CommunityPublicProfile;
    }
    return null;
  }, [
    hostMember?.userId,
    isHosting,
    profileAvatarUrl,
    profileCountryCode,
    profileDisplayName,
    profileNickname,
    profilesByUserId,
    room,
    stats,
    user,
  ]);

  const guestProfile = guestMember
    ? profilesByUserId[guestMember.userId] ?? null
    : null;

  const gameLabel = room
    ? communityMatchGameLabel(room.gameType, room.rules)
    : null;
  const bestOfLabel = room
    ? communityMatchFormatLabel(room.gameType, room.rules)
    : null;

  if (!user) {
    return (
      <GameSetupPage title="Community">
        <div className={cn("community-room", isIPhone && "community-room--iphone")}>
          <p className="community-room__copy">Sign in to join this match.</p>
          <Link href={LOGIN_PATH} className="community-room__sign-in-link">
            <TouchButton type="button" fullWidth size="lg">
              Sign in
            </TouchButton>
          </Link>
        </div>
      </GameSetupPage>
    );
  }

  if (loading || !room || !inWaitingRoom) {
    return (
      <GameSetupPage title="Community">
        <p className="community-room__status">Loading match…</p>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title="Community" className={cn(isIPhone && "community-page--iphone")}>
      <div
        className={cn(
          "community-room community-waiting",
          isIPhone && "community-room--iphone",
        )}
      >
        {error ? <p className="community-room__error">{error}</p> : null}

        <article className="community-waiting__panel">
          <div className="community-waiting__strip" aria-label="Match waiting room">
            <span className="community-waiting__strip-copy">Match Waiting Room</span>
            <div className="community-waiting__strip-end">
              {isHosting ? (
                <span className="community-waiting__strip-code">{room.code}</span>
              ) : null}
              <span
                className="community-waiting__strip-timer"
                aria-label={`${formatCountdown(startSecondsLeft ?? MATCH_START_TIMEOUT_MS / 1000)} remaining to start`}
              >
                {formatCountdown(startSecondsLeft ?? MATCH_START_TIMEOUT_MS / 1000)}
              </span>
            </div>
          </div>

          <div className="community-waiting__body">
            <div className="community-waiting__heading-col">
              <div
                className="community-waiting__loader"
                role="status"
                aria-label="Waiting for match to start"
              >
                <span className="community-waiting__spinner" aria-hidden />
              </div>
              <h2 className="community-waiting__lede">
                {isHosting
                  ? "Your opponent is ready. Start when you want to bring them into the match."
                  : "Please wait until the host brings you into the match."}
              </h2>
              <div className="community-waiting__heading-actions">
                <TouchButton
                  type="button"
                  variant="secondary"
                  fullWidth
                  size="lg"
                  disabled={busy}
                  onClick={() => {
                    void leaveRoom().then(() => router.replace("/community"));
                  }}
                >
                  {isHosting ? "Close room" : "Leave"}
                </TouchButton>
              </div>
            </div>

            <div className="community-waiting__seats-col">
              {(gameLabel || bestOfLabel) ? (
                <p className="community-waiting__format">
                  {gameLabel ? <span>{gameLabel}</span> : null}
                  {gameLabel && bestOfLabel ? (
                    <span className="community-waiting__format-sep" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {bestOfLabel ? <span>{bestOfLabel}</span> : null}
                </p>
              ) : null}
              <div className="community-waiting__seats" aria-label="Match players">
                <WaitingSeat
                  profile={hostProfile}
                  fallbackName="Host"
                  roleLabel="Host"
                  onSelect={
                    hostMember
                      ? () => setPreviewUserId(hostMember.userId)
                      : undefined
                  }
                />
                <div className="community-waiting__vs" aria-hidden>
                  vs
                </div>
                <WaitingSeat
                  profile={guestProfile}
                  fallbackName="Opponent"
                  roleLabel="Opponent"
                  onSelect={
                    guestMember
                      ? () => setPreviewUserId(guestMember.userId)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </article>

        {isHosting ? (
          <div className="community-waiting__actions">
            <TouchButton
              type="button"
              fullWidth
              size="lg"
              disabled={busy}
              onClick={() => {
                void startMatch().then((started) => {
                  if (started) {
                    router.push("/community/match");
                  }
                });
              }}
            >
              Start match
            </TouchButton>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(isGuest && roomClosingAt && closingSecondsLeft != null)}
        title="Match didn't start"
        description={
          closingSecondsLeft != null && closingSecondsLeft > 0
            ? `The host didn't start the match. This room will close in ${closingSecondsLeft} second${
                closingSecondsLeft === 1 ? "" : "s"
              }.`
            : "This room is closing now."
        }
        confirmLabel="Close Now"
        hideCancel
        busy={busy}
        className="community-room-closing-modal"
        onCancel={() => {
          void closeRoomNow().then(() => router.replace("/community"));
        }}
        onConfirm={() => {
          void closeRoomNow().then(() => router.replace("/community"));
        }}
      />

      <CommunityPlayerPreviewSheet
        open={Boolean(previewUserId)}
        userId={previewUserId}
        onClose={() => setPreviewUserId(null)}
      />
    </GameSetupPage>
  );
}
