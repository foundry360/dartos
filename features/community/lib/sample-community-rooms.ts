import type { CommunityFeedRoom } from "@/features/community/components/CommunityOpenRoomCard";
import type { CommunityJoinRequest } from "@/lib/supabase/queries/community-rooms";

/** Preview: host card with pending join requests (red Review requests button). */
export const SAMPLE_MY_COMMUNITY_ROOM: CommunityFeedRoom = {
  roomId: "00000000-0000-4000-8000-000000000099",
  roomCode: "DEMO01",
  hostId: "00000000-0000-4000-8000-000000000199",
  createdAt: new Date().toISOString(),
  gameType: "x01",
  rules: {
    gameType: 501,
    legsToWin: 2,
    setsToWin: 1,
    inRule: "straight_in",
    outRule: "double_out",
    startingPlayerRule: "winner_previous_leg",
  },
  hostDisplayName: "You",
  hostNickname: null,
  hostAvatarUrl: null,
  hostCountryCode: "US",
  hostThreeDartAverage: 58.2,
  alreadyRequested: false,
  isMine: true,
  seatCount: 1,
  pendingRequestCount: 2,
};

/** Preview join requests for the sample host card / empty live host lobby. */
export const SAMPLE_COMMUNITY_JOIN_REQUESTS: CommunityJoinRequest[] = [
  {
    requestId: "00000000-0000-4000-8000-000000000201",
    roomId: SAMPLE_MY_COMMUNITY_ROOM.roomId,
    requesterId: "00000000-0000-4000-8000-000000000101",
    createdAt: new Date().toISOString(),
    requesterDisplayName: "Jordan Miles",
    requesterNickname: "Jordo",
    requesterAvatarUrl: null,
    requesterCountryCode: "US",
    requesterThreeDartAverage: 62.4,
  },
  {
    requestId: "00000000-0000-4000-8000-000000000202",
    roomId: SAMPLE_MY_COMMUNITY_ROOM.roomId,
    requesterId: "00000000-0000-4000-8000-000000000102",
    createdAt: new Date().toISOString(),
    requesterDisplayName: "Alex Rivera",
    requesterNickname: "AR",
    requesterAvatarUrl: null,
    requesterCountryCode: "MX",
    requesterThreeDartAverage: 48.1,
  },
];

/** Dev/preview cards so the feed layout is visible without other live hosts. */
export const SAMPLE_COMMUNITY_FEED_ROOMS: CommunityFeedRoom[] = [
  {
    roomId: "00000000-0000-4000-8000-000000000001",
    roomCode: "",
    hostId: "00000000-0000-4000-8000-000000000101",
    createdAt: new Date().toISOString(),
    gameType: "x01",
    rules: {
      gameType: 501,
      legsToWin: 2,
      setsToWin: 1,
      inRule: "straight_in",
      outRule: "double_out",
      startingPlayerRule: "winner_previous_leg",
    },
    hostDisplayName: "Jordan Miles",
    hostNickname: "Jordo",
    hostAvatarUrl: null,
    hostCountryCode: "US",
    hostThreeDartAverage: 62.4,
    alreadyRequested: false,
    seatCount: 1,
    // Public sample cards omit codes (host-only).
  },
  {
    roomId: "00000000-0000-4000-8000-000000000002",
    roomCode: "",
    hostId: "00000000-0000-4000-8000-000000000102",
    createdAt: new Date().toISOString(),
    gameType: "cricket",
    rules: {
      variant: "classic",
      legsToWin: 3,
      setsToWin: 1,
      startingPlayerRule: "winner_previous_leg",
    },
    hostDisplayName: "Alex Rivera",
    hostNickname: "AR",
    hostAvatarUrl: null,
    hostCountryCode: "MX",
    hostThreeDartAverage: 48.1,
    alreadyRequested: true,
    seatCount: 1,
  },
  {
    roomId: "00000000-0000-4000-8000-000000000003",
    roomCode: "",
    hostId: "00000000-0000-4000-8000-000000000103",
    createdAt: new Date().toISOString(),
    gameType: "x01",
    rules: {
      gameType: 501,
      legsToWin: 3,
      setsToWin: 1,
      inRule: "straight_in",
      outRule: "double_out",
      startingPlayerRule: "winner_previous_leg",
    },
    hostDisplayName: "Sam Okonkwo",
    hostNickname: null,
    hostAvatarUrl: null,
    hostCountryCode: "GB",
    hostThreeDartAverage: 71.8,
    alreadyRequested: false,
    seatCount: 1,
  },
  {
    roomId: "00000000-0000-4000-8000-000000000004",
    roomCode: "",
    hostId: "00000000-0000-4000-8000-000000000104",
    createdAt: new Date().toISOString(),
    gameType: "x01",
    rules: {
      gameType: 301,
      legsToWin: 5,
      setsToWin: 1,
      inRule: "double_in",
      outRule: "double_out",
      startingPlayerRule: "winner_previous_leg",
    },
    hostDisplayName: "Casey Nguyen",
    hostNickname: "Case",
    hostAvatarUrl: null,
    hostCountryCode: "CA",
    hostThreeDartAverage: 54.2,
    alreadyRequested: false,
    seatCount: 1,
  },
];

const SAMPLE_ROOM_IDS = new Set([
  SAMPLE_MY_COMMUNITY_ROOM.roomId,
  ...SAMPLE_COMMUNITY_FEED_ROOMS.map((room) => room.roomId),
]);
const SAMPLE_HOST_IDS = new Set([
  SAMPLE_MY_COMMUNITY_ROOM.hostId,
  ...SAMPLE_COMMUNITY_FEED_ROOMS.map((room) => room.hostId),
]);
const SAMPLE_JOIN_REQUEST_IDS = new Set(
  SAMPLE_COMMUNITY_JOIN_REQUESTS.map((request) => request.requestId),
);

export function isSampleCommunityRoom(roomId: string) {
  return SAMPLE_ROOM_IDS.has(roomId);
}

export function isSampleCommunityHost(hostId: string) {
  return SAMPLE_HOST_IDS.has(hostId);
}

export function isSampleCommunityJoinRequest(requestId: string) {
  return SAMPLE_JOIN_REQUEST_IDS.has(requestId);
}
