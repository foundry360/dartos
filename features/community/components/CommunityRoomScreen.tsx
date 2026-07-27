"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormTextField } from "@/components/ui/FormField";
import { TouchButton } from "@/components/ui/TouchButton";
import { CommunityMatchCard } from "@/features/community/components/CommunityMatchCard";
import { CommunityMatchSetupForm } from "@/features/community/components/CommunityMatchSetupForm";
import {
  CommunityOpenRoomCard,
  type CommunityFeedRoom,
} from "@/features/community/components/CommunityOpenRoomCard";
import { CommunityPlayerPreviewSheet } from "@/features/community/components/CommunityPlayerPreviewSheet";
import { CommunityShareRoomSheet } from "@/features/community/components/CommunityShareRoomSheet";
import { useCommunityRoom } from "@/features/community/hooks/useCommunityRoom";
import {
  communityMatchFormatLabel,
  communityMatchGameLabel,
} from "@/features/community/lib/community-match-config";
import {
  isSampleCommunityHost,
  isSampleCommunityRoom,
  SAMPLE_COMMUNITY_FEED_ROOMS,
} from "@/features/community/lib/sample-community-rooms";
import { useProfileStore } from "@/features/profile/store/profile-store";
import {
  getThreeDartAverage,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";
import { isIPhoneDevice } from "@/utils/fullscreen";
import "@/features/community/community.css";

type CommunityAverageFilter = "any" | "under50" | "50to65" | "65plus";

const AVERAGE_FILTER_OPTIONS: {
  id: CommunityAverageFilter;
  label: string;
  description: string;
}[] = [
  {
    id: "any",
    label: "Any average",
    description: "Show rooms from every host, regardless of 3-dart average.",
  },
  {
    id: "under50",
    label: "Under 50",
    description: "Hosts averaging below 50.",
  },
  {
    id: "50to65",
    label: "50–65",
    description: "Hosts averaging between 50 and 65.",
  },
  {
    id: "65plus",
    label: "65+",
    description: "Hosts averaging 65 or higher.",
  },
];

export function CommunityRoomScreen() {
  const {
    user,
    room,
    members,
    profilesByUserId,
    openRooms,
    loading,
    busy,
    error,
    createRoom,
    joinRoom,
    joinOpenRoom,
    leaveRoom,
  } = useCommunityRoom();

  const profileDisplayName = useProfileStore((state) => state.displayName);
  const profileNickname = useProfileStore((state) => state.nickname);
  const profileAvatarUrl = useProfileStore((state) => state.avatarUrl);
  const profileCountryCode = useProfileStore((state) => state.countryCode);
  const stats = useStatisticsStore((state) => state.stats);

  const [isIPhone, setIsIPhone] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [configuringMatch, setConfiguringMatch] = useState(false);
  const [sharingRoom, setSharingRoom] = useState(false);
  const [roomFilter, setRoomFilter] = useState<"all" | "501" | "cricket">("all");
  const [averageFilter, setAverageFilter] = useState<CommunityAverageFilter>("any");
  const [averageSheetOpen, setAverageSheetOpen] = useState(false);
  const [alreadyInRoomOpen, setAlreadyInRoomOpen] = useState(false);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  const averageFilterLabel =
    AVERAGE_FILTER_OPTIONS.find((option) => option.id === averageFilter)?.label ??
    "Any average";

  const seatCount = members.filter((member) => member.seat != null).length;
  const isHosting = Boolean(user && room && room.hostId === user.id);
  const isInRoom = Boolean(user && room);
  const matchReady = seatCount >= 2;

  const myFeedRoom = useMemo<CommunityFeedRoom | null>(() => {
    if (!user || !room || room.hostId !== user.id || room.status !== "lobby") {
      return null;
    }
    // Once an opponent joins, the match card takes over.
    if (matchReady) {
      return null;
    }

    return {
      roomId: room.id,
      roomCode: room.code,
      hostId: room.hostId,
      createdAt: room.createdAt,
      gameType: room.gameType,
      rules: room.rules,
      hostDisplayName: profileDisplayName,
      hostNickname: profileNickname,
      hostAvatarUrl: profileAvatarUrl,
      hostCountryCode: profileCountryCode,
      hostThreeDartAverage: getThreeDartAverage(stats),
      alreadyRequested: false,
      hasPendingRequests: false,
      isMine: true,
      seatCount: Math.max(seatCount, 1),
    };
  }, [
    matchReady,
    profileAvatarUrl,
    profileCountryCode,
    profileDisplayName,
    profileNickname,
    room,
    seatCount,
    stats,
    user,
  ]);

  const feedRooms = useMemo<CommunityFeedRoom[]>(() => {
    const others: CommunityFeedRoom[] = openRooms.filter(
      (openRoom) => openRoom.roomId !== myFeedRoom?.roomId,
    );
    const liveRooms = myFeedRoom ? [myFeedRoom, ...others] : others;
    if (process.env.NODE_ENV !== "production") {
      return [...liveRooms, ...SAMPLE_COMMUNITY_FEED_ROOMS];
    }
    return liveRooms;
  }, [myFeedRoom, openRooms]);

  const filteredFeedRooms = useMemo(() => {
    return feedRooms.filter((openRoom) => {
      const matchesGame =
        roomFilter === "all"
          ? true
          : roomFilter === "cricket"
            ? openRoom.gameType === "cricket"
            : openRoom.gameType === "x01" &&
              typeof openRoom.rules.gameType === "number" &&
              openRoom.rules.gameType === 501;

      if (!matchesGame) {
        return false;
      }

      const average = openRoom.hostThreeDartAverage;
      if (averageFilter === "under50") {
        return average > 0 && average < 50;
      }
      if (averageFilter === "50to65") {
        return average >= 50 && average < 65;
      }
      if (averageFilter === "65plus") {
        return average >= 65;
      }
      return true;
    });
  }, [averageFilter, feedRooms, roomFilter]);

  const isFeedEmpty = filteredFeedRooms.length === 0;
  const hasAnyRooms = feedRooms.length > 0;

  const hostMember = members.find((member) => member.seat === 0) ?? null;
  const guestMember = members.find((member) => member.seat === 1) ?? null;
  const matchFormatLabel = room
    ? `${communityMatchGameLabel(room.gameType, room.rules)} · ${communityMatchFormatLabel(room.gameType, room.rules)}`
    : null;

  const tryStartHosting = () => {
    if (isInRoom) {
      setAlreadyInRoomOpen(true);
      return;
    }
    setConfiguringMatch(true);
  };

  const handleJoinRoom = (roomId: string) => {
    // Hosts: joining another room auto-closes your lobby (server-side).
    if (isInRoom && !isHosting) {
      setAlreadyInRoomOpen(true);
      return;
    }
    if (isSampleCommunityRoom(roomId)) {
      return;
    }
    void joinOpenRoom(roomId);
  };

  if (!user) {
    return (
      <GameSetupPage title="Community">
        <div
          className={cn(
            "community-room community-room--signed-out",
            isIPhone && "community-room--iphone",
          )}
        >
          <p className="community-room__copy">
            Sign in with your Vector account to host or join a Community Play room.
          </p>
          <Link href={LOGIN_PATH} className="community-room__sign-in-link">
            <TouchButton type="button" fullWidth size="lg">
              Sign in
            </TouchButton>
          </Link>
        </div>
      </GameSetupPage>
    );
  }

  if (configuringMatch) {
    return (
      <GameSetupPage title="Match setup">
        <div className={cn(isIPhone && "community-room--iphone")}>
          {error ? <p className="community-room__error">{error}</p> : null}
          <CommunityMatchSetupForm
            busy={busy}
            onCancel={() => setConfiguringMatch(false)}
            onConfirm={(config) => {
              void createRoom(config).then(() => setConfiguringMatch(false));
            }}
          />
        </div>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title="Community" className={cn(isIPhone && "community-page--iphone")}>
      <div className={cn("community-room", isIPhone && "community-room--iphone")}>
        {loading ? <p className="community-room__status">Loading community…</p> : null}
        {error ? <p className="community-room__error">{error}</p> : null}

        {!loading ? (
          <div className="community-feed">
            <div className="community-feed__main">
              {room && matchReady ? (
                <div className="community-feed__active-match">
                  <CommunityMatchCard
                    roomCode={room.code}
                    formatLabel={matchFormatLabel}
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
                      profile: guestMember
                        ? profilesByUserId[guestMember.userId] ?? null
                        : null,
                      label: "Opponent",
                      emptyLabel: "Waiting…",
                    }}
                    onSelectPlayer={(playerId) => {
                      if (isSampleCommunityHost(playerId)) {
                        return;
                      }
                      setPreviewUserId(playerId);
                    }}
                  />
                  <p className="community-feed__match-ready">
                    Match ready. Online scoring for Community Play is next — for now you can
                    leave or close the room.
                  </p>
                  <TouchButton
                    type="button"
                    variant="secondary"
                    fullWidth
                    size="lg"
                    disabled={busy}
                    onClick={() => void leaveRoom()}
                  >
                    {isHosting ? "Close room" : "Leave room"}
                  </TouchButton>
                </div>
              ) : null}

              {isIPhone || !hasAnyRooms || matchReady ? null : (
                <header className="community-feed__header">
                  <h2 className="community-feed__title">Community</h2>
                  <p className="community-feed__lede">
                    Open rooms right now. Join instantly — first come, first served.
                  </p>
                </header>
              )}

              {!matchReady && hasAnyRooms ? (
                <>
                  <div className="community-feed__toolbar">
                    <div className="community-feed__filters" role="group" aria-label="Filter rooms">
                      {(
                        [
                          { id: "all", label: isIPhone ? "All" : "All rooms" },
                          { id: "501", label: "501" },
                          { id: "cricket", label: "Cricket" },
                        ] as const
                      ).map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          className={
                            roomFilter === filter.id
                              ? "community-feed__filter is-active"
                              : "community-feed__filter"
                          }
                          onClick={() => setRoomFilter(filter.id)}
                        >
                          {filter.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={
                          averageFilter === "any"
                            ? "community-feed__filter community-feed__avg-trigger"
                            : "community-feed__filter community-feed__avg-trigger is-active"
                        }
                        aria-haspopup="dialog"
                        aria-expanded={averageSheetOpen}
                        onClick={() => setAverageSheetOpen(true)}
                      >
                        <span>{averageFilter === "any" ? "Avg" : averageFilterLabel}</span>
                        <span className="community-feed__avg-chevron" aria-hidden />
                      </button>
                    </div>
                    <p className="community-feed__online">
                      <span className="community-feed__online-dot" aria-hidden />
                      {filteredFeedRooms.length} room
                      {filteredFeedRooms.length === 1 ? "" : "s"} open
                    </p>
                    {isIPhone ? null : (
                      <div className="community-feed__toolbar-end">
                        <TouchButton
                          type="button"
                          className="community-feed__host-btn"
                          size="lg"
                          disabled={busy || isHosting}
                          onClick={tryStartHosting}
                        >
                          + Host a room
                        </TouchButton>
                      </div>
                    )}
                  </div>

                  {isIPhone ? (
                    <TouchButton
                      type="button"
                      className="community-feed__host-btn community-feed__host-btn--iphone"
                      size="lg"
                      fullWidth
                      disabled={busy || isHosting}
                      onClick={tryStartHosting}
                    >
                      + Host a room
                    </TouchButton>
                  ) : null}
                </>
              ) : null}

              {!matchReady && isFeedEmpty ? (
                <div className="community-feed__empty">
                  <p className="community-feed__empty-title">
                    {hasAnyRooms ? "No rooms match your filters" : "No rooms open right now"}
                  </p>
                  <p className="community-feed__empty-copy">
                    {hasAnyRooms
                      ? "Try a different game or average filter to see open rooms."
                      : isIPhone
                        ? "Be the first to host and wait for a challenge."
                        : "Be the first to host. Pick a format, open a room, and wait for someone to join."}
                  </p>
                  {hasAnyRooms ? null : (
                    <TouchButton
                      type="button"
                      className="community-feed__empty-host-btn"
                      size="lg"
                      disabled={busy || isHosting}
                      onClick={tryStartHosting}
                    >
                      + Host a room
                    </TouchButton>
                  )}
                </div>
              ) : null}

              {!matchReady && !isFeedEmpty ? (
                <div className="community-feed__grid">
                  {filteredFeedRooms.map((openRoom) => (
                    <CommunityOpenRoomCard
                      key={openRoom.roomId}
                      room={openRoom}
                      busy={busy}
                      onJoin={handleJoinRoom}
                      onSelectHost={(hostId) => {
                        if (isSampleCommunityHost(hostId)) {
                          return;
                        }
                        setPreviewUserId(hostId);
                      }}
                      onCloseRoom={(roomId) => {
                        if (isSampleCommunityRoom(roomId)) {
                          return;
                        }
                        void leaveRoom();
                      }}
                      onShareRoom={(roomId) => {
                        if (isSampleCommunityRoom(roomId)) {
                          return;
                        }
                        if (room?.id === roomId) {
                          setSharingRoom(true);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {!matchReady ? (
              <details className="community-feed__code">
                <summary>Have a room code?</summary>
                <div className="community-feed__code-body">
                  <FormTextField
                    label="Room code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={8}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    disabled={busy || (isInRoom && !isHosting)}
                  />
                  <TouchButton
                    type="button"
                    variant="secondary"
                    fullWidth
                    size="lg"
                    disabled={busy || joinCode.trim().length < 4}
                    onClick={() => {
                      if (isInRoom && !isHosting) {
                        setAlreadyInRoomOpen(true);
                        return;
                      }
                      void joinRoom(joinCode.trim());
                    }}
                  >
                    Join with code
                  </TouchButton>
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={alreadyInRoomOpen}
        title="Already in a room"
        description={
          room?.code
            ? `You're already in room ${room.code}. Leave or close that room before joining another.`
            : "You're already in another room. Leave it before joining a new one."
        }
        confirmLabel="Got It"
        hideCancel
        className="community-already-in-room-modal"
        onCancel={() => setAlreadyInRoomOpen(false)}
        onConfirm={() => setAlreadyInRoomOpen(false)}
      />

      <CommunityPlayerPreviewSheet
        open={Boolean(previewUserId)}
        userId={previewUserId}
        onClose={() => setPreviewUserId(null)}
      />

      <CommunityShareRoomSheet
        open={sharingRoom && isHosting && Boolean(room)}
        roomId={room?.id ?? ""}
        roomCode={room?.code ?? ""}
        onClose={() => setSharingRoom(false)}
      />

      <BottomSheet
        open={averageSheetOpen}
        title="3-dart average"
        onClose={() => setAverageSheetOpen(false)}
        className="community-feed__avg-sheet"
      >
        <p className="community-feed__avg-sheet-lede">
          Filter open rooms by the host&apos;s 3-dart average.
        </p>
        <div className="community-feed__avg-options">
          {AVERAGE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={
                option.id === averageFilter
                  ? "community-feed__avg-option is-selected"
                  : "community-feed__avg-option"
              }
              onClick={() => {
                setAverageFilter(option.id);
                setAverageSheetOpen(false);
              }}
            >
              <span className="community-feed__avg-option-label">{option.label}</span>
              <span className="community-feed__avg-option-copy">{option.description}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </GameSetupPage>
  );
}
