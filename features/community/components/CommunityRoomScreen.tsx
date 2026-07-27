"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FormTextField } from "@/components/ui/FormField";
import { TouchButton } from "@/components/ui/TouchButton";
import { CommunityJoinRequestsSheet } from "@/features/community/components/CommunityJoinRequestsSheet";
import { CommunityMatchSetupForm } from "@/features/community/components/CommunityMatchSetupForm";
import {
  CommunityOpenRoomCard,
  type CommunityFeedRoom,
} from "@/features/community/components/CommunityOpenRoomCard";
import { CommunityPlayerPreviewSheet } from "@/features/community/components/CommunityPlayerPreviewSheet";
import { CommunityShareRoomSheet } from "@/features/community/components/CommunityShareRoomSheet";
import { useCommunityRoom } from "@/features/community/hooks/useCommunityRoom";
import {
  isSampleCommunityHost,
  isSampleCommunityJoinRequest,
  isSampleCommunityRoom,
  SAMPLE_COMMUNITY_FEED_ROOMS,
  SAMPLE_COMMUNITY_JOIN_REQUESTS,
} from "@/features/community/lib/sample-community-rooms";
import { useProfileStore } from "@/features/profile/store/profile-store";
import {
  getThreeDartAverage,
  useStatisticsStore,
} from "@/features/statistics/store/statistics-store";
import { LOGIN_PATH } from "@/lib/auth/routes";
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
    openRooms,
    joinRequests,
    loading,
    busy,
    error,
    createRoom,
    joinRoom,
    requestJoin,
    respondToJoinRequest,
    leaveRoom,
  } = useCommunityRoom();

  const profileDisplayName = useProfileStore((state) => state.displayName);
  const profileNickname = useProfileStore((state) => state.nickname);
  const profileAvatarUrl = useProfileStore((state) => state.avatarUrl);
  const profileCountryCode = useProfileStore((state) => state.countryCode);
  const stats = useStatisticsStore((state) => state.stats);

  const [joinCode, setJoinCode] = useState("");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [configuringMatch, setConfiguringMatch] = useState(false);
  const [managingRequests, setManagingRequests] = useState(false);
  const [sharingRoom, setSharingRoom] = useState(false);
  const [roomFilter, setRoomFilter] = useState<"all" | "501" | "cricket">("all");
  const [averageFilter, setAverageFilter] = useState<CommunityAverageFilter>("any");
  const [averageSheetOpen, setAverageSheetOpen] = useState(false);

  const averageFilterLabel =
    AVERAGE_FILTER_OPTIONS.find((option) => option.id === averageFilter)?.label ??
    "Any average";

  const seatCount = members.filter((member) => member.seat != null).length;
  const isHosting = Boolean(user && room && room.hostId === user.id);

  const myFeedRoom = useMemo<CommunityFeedRoom | null>(() => {
    if (!user || !room || room.hostId !== user.id || room.status !== "lobby") {
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
      isMine: true,
      seatCount: Math.max(seatCount, 1),
      // Keep sample pending count for localhost preview of the red CTA.
      pendingRequestCount: Math.max(
        joinRequests.length,
        SAMPLE_COMMUNITY_JOIN_REQUESTS.length,
      ),
    };
  }, [
    joinRequests.length,
    profileAvatarUrl,
    profileCountryCode,
    profileDisplayName,
    profileNickname,
    room,
    seatCount,
    stats,
    user,
  ]);

  const feedRooms = useMemo(() => {
    const others = openRooms.filter((openRoom) => openRoom.roomId !== myFeedRoom?.roomId);
    if (myFeedRoom) {
      return [myFeedRoom, ...others, ...SAMPLE_COMMUNITY_FEED_ROOMS];
    }
    // Keep the feed empty when nobody is hosting so the empty-state CTA can show.
    if (others.length === 0) {
      return [];
    }
    return [...others, ...SAMPLE_COMMUNITY_FEED_ROOMS];
  }, [myFeedRoom, openRooms]);

  const previewJoinRequests = useMemo(() => {
    if (joinRequests.length > 0) {
      return joinRequests;
    }
    return SAMPLE_COMMUNITY_JOIN_REQUESTS;
  }, [joinRequests]);

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

  if (!user) {
    return (
      <GameSetupPage title="Community">
        <div className="community-room community-room--signed-out">
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
        {error ? <p className="community-room__error">{error}</p> : null}
        <CommunityMatchSetupForm
          busy={busy}
          onCancel={() => setConfiguringMatch(false)}
          onConfirm={(config) => {
            void createRoom(config).then(() => setConfiguringMatch(false));
          }}
        />
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title="Community">
      <div className="community-room">
        {loading ? <p className="community-room__status">Loading community…</p> : null}
        {error ? <p className="community-room__error">{error}</p> : null}

        {!loading ? (
          <div className="community-feed">
            <header className="community-feed__header">
              <h2 className="community-feed__title">Community</h2>
              <p className="community-feed__lede">
                Rooms open right now, hosted by players online. Join one, or open your own and
                see who shows up.
              </p>
            </header>

            <div className="community-feed__toolbar">
              <div className="community-feed__filters" role="group" aria-label="Filter rooms">
                {(
                  [
                    { id: "all", label: "All rooms" },
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
                <p className="community-feed__online">
                  <span className="community-feed__online-dot" aria-hidden />
                  {filteredFeedRooms.length} room
                  {filteredFeedRooms.length === 1 ? "" : "s"} open
                </p>
              </div>
              <div className="community-feed__toolbar-end">
                <TouchButton
                  type="button"
                  className="community-feed__host-btn"
                  size="lg"
                  disabled={busy || isHosting}
                  onClick={() => setConfiguringMatch(true)}
                >
                  + Host a room
                </TouchButton>
              </div>
            </div>

            {isFeedEmpty ? (
              <div className="community-feed__empty">
                <p className="community-feed__empty-title">No rooms open right now</p>
                <p className="community-feed__empty-copy">
                  Be the first to host. Pick a format, open a room, and wait for someone to
                  challenge you.
                </p>
                <TouchButton
                  type="button"
                  className="community-feed__empty-host-btn"
                  size="lg"
                  disabled={busy || isHosting}
                  onClick={() => setConfiguringMatch(true)}
                >
                  + Host a room
                </TouchButton>
              </div>
            ) : (
              <div className="community-feed__grid">
                {filteredFeedRooms.map((openRoom) => (
                  <CommunityOpenRoomCard
                    key={openRoom.roomId}
                    room={openRoom}
                    busy={busy}
                    onRequestJoin={(roomId) => {
                      if (isSampleCommunityRoom(roomId)) {
                        return;
                      }
                      void requestJoin(roomId);
                    }}
                    onSelectHost={(hostId) => {
                      if (isSampleCommunityHost(hostId)) {
                        return;
                      }
                      setPreviewUserId(hostId);
                    }}
                    onManageRoom={(roomId) => {
                      if (isSampleCommunityRoom(roomId) || room?.id === roomId) {
                        setManagingRequests(true);
                      }
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
            )}

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
                  disabled={busy || isHosting}
                />
                <TouchButton
                  type="button"
                  variant="secondary"
                  fullWidth
                  size="lg"
                  disabled={busy || isHosting || joinCode.trim().length < 4}
                  onClick={() => void joinRoom(joinCode.trim())}
                >
                  Join with code
                </TouchButton>
              </div>
            </details>
          </div>
        ) : null}
      </div>

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

      <CommunityJoinRequestsSheet
        open={managingRequests && isHosting}
        roomCode={room?.code ?? ""}
        requests={previewJoinRequests}
        busy={busy}
        onClose={() => setManagingRequests(false)}
        onSelectPlayer={(userId) => {
          if (isSampleCommunityHost(userId)) {
            return;
          }
          setPreviewUserId(userId);
        }}
        onRespond={(requestId, accept) => {
          if (isSampleCommunityJoinRequest(requestId)) {
            setManagingRequests(false);
            return;
          }
          void respondToJoinRequest(requestId, accept).then(() => {
            if (accept) {
              setManagingRequests(false);
            }
          });
        }}
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
