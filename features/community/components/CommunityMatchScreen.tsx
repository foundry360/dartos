"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { TouchButton } from "@/components/ui/TouchButton";
import { CommunityMatchCard } from "@/features/community/components/CommunityMatchCard";
import { useCommunityRoom } from "@/features/community/hooks/useCommunityRoom";
import {
  communityMatchFormatLabel,
  communityMatchGameLabel,
} from "@/features/community/lib/community-match-config";
import { useProfileStore } from "@/features/profile/store/profile-store";
import {
  getThreeDartAverage,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";
import { isIPhoneDevice } from "@/utils/fullscreen";
import "@/features/community/community.css";

export function CommunityMatchScreen() {
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
  } = useCommunityRoom();

  const profileDisplayName = useProfileStore((state) => state.displayName);
  const profileNickname = useProfileStore((state) => state.nickname);
  const profileAvatarUrl = useProfileStore((state) => state.avatarUrl);
  const profileCountryCode = useProfileStore((state) => state.countryCode);
  const stats = useStatisticsStore((state) => state.stats);
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

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
    if (room.status === "lobby") {
      router.replace("/community");
    }
  }, [loading, room, router, user]);

  if (!user) {
    return (
      <GameSetupPage title="Community">
        <div className={cn("community-room", isIPhone && "community-room--iphone")}>
          <p className="community-room__copy">Sign in to enter this match.</p>
          <Link href={LOGIN_PATH} className="community-room__sign-in-link">
            <TouchButton type="button" fullWidth size="lg">
              Sign in
            </TouchButton>
          </Link>
        </div>
      </GameSetupPage>
    );
  }

  if (loading || !room || room.status !== "playing") {
    return (
      <GameSetupPage title="Community">
        <p className="community-room__status">Loading match…</p>
      </GameSetupPage>
    );
  }

  const isHosting = room.hostId === user.id;
  const hostMember = members.find((member) => member.seat === 0) ?? null;
  const guestMember = members.find((member) => member.seat === 1) ?? null;
  const formatLabel = `${communityMatchGameLabel(room.gameType, room.rules)} · ${communityMatchFormatLabel(room.gameType, room.rules)}`;

  return (
    <GameSetupPage title="Community" className={cn(isIPhone && "community-page--iphone")}>
      <div className={cn("community-room", isIPhone && "community-room--iphone")}>
        {error ? <p className="community-room__error">{error}</p> : null}

        <div className="community-feed__active-match">
          <CommunityMatchCard
            roomCode={room.code}
            formatLabel={formatLabel}
            statusLabel="Live"
            hostSeat={{
              userId: hostMember?.userId ?? room.hostId,
              profile:
                profilesByUserId[hostMember?.userId ?? room.hostId] ??
                (isHosting
                  ? {
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
                    }
                  : null),
              label: "Host",
              emptyLabel: "Host",
            }}
            guestSeat={{
              userId: guestMember?.userId ?? null,
              profile: guestMember ? profilesByUserId[guestMember.userId] ?? null : null,
              label: "Opponent",
              emptyLabel: "Opponent",
            }}
            onSelectPlayer={() => {
              // Profiles stay on the community feed for now.
            }}
          />

          <p className="community-feed__match-ready">
            You&apos;re in. Live online scoring for Community Play is next — for now both
            players share this match room.
          </p>

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
            {isHosting ? "End match" : "Leave match"}
          </TouchButton>
        </div>
      </div>
    </GameSetupPage>
  );
}
