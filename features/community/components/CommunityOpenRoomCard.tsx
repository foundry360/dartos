"use client";

import {
  communityMatchFormatLabel,
  communityMatchGameLabel,
} from "@/features/community/lib/community-match-config";
import {
  communityDisplayInitials,
  communityFirstName,
} from "@/features/community/lib/community-name";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import type { OpenCommunityRoom } from "@/lib/supabase/queries/community-rooms";
import { cn } from "@/utils/cn";

export type CommunityFeedRoom = OpenCommunityRoom & {
  isMine?: boolean;
  seatCount?: number;
  pendingRequestCount?: number;
};

interface CommunityOpenRoomCardProps {
  room: CommunityFeedRoom;
  busy?: boolean;
  onRequestJoin: (roomId: string) => void;
  onSelectHost: (hostId: string) => void;
  onManageRoom?: (roomId: string) => void;
  onCloseRoom?: (roomId: string) => void;
  onShareRoom?: (roomId: string) => void;
}

export function CommunityOpenRoomCard({
  room,
  busy = false,
  onRequestJoin,
  onSelectHost,
  onManageRoom,
  onCloseRoom,
  onShareRoom,
}: CommunityOpenRoomCardProps) {
  const firstName = communityFirstName(room.hostDisplayName, "Host");
  const hasAverage = room.hostThreeDartAverage > 0;
  const averageValue = room.hostThreeDartAverage.toFixed(1);
  const gameLabel = communityMatchGameLabel(room.gameType, room.rules);
  const formatLabel = communityMatchFormatLabel(room.gameType, room.rules);
  const seatCount = room.seatCount ?? 1;
  const spotsLeft = Math.max(2 - seatCount, 0);
  const pendingCount = room.pendingRequestCount ?? 0;

  return (
    <article
      className={cn("community-feed-card", room.isMine && "community-feed-card--mine")}
    >
      <div className="community-feed-card__strip" aria-label="Match format">
        <span className="community-feed-card__strip-copy">
          <span>{gameLabel}</span>
          <span className="community-feed-card__spec-sep" aria-hidden>
            ·
          </span>
          <span>{formatLabel}</span>
        </span>
        {room.isMine ? (
          <button
            type="button"
            className="community-feed-card__share"
            aria-label="Share room"
            disabled={busy}
            onClick={() => onShareRoom?.(room.roomId)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98" />
              <path d="M15.41 6.51l-6.82 3.98" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="community-feed-card__body">
        <button
          type="button"
          className="community-feed-card__host"
          onClick={() => onSelectHost(room.hostId)}
        >
          <span className="community-feed-card__avatar-wrap">
            <span className="community-feed-card__avatar" aria-hidden>
              {room.hostAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={room.hostAvatarUrl} alt="" />
              ) : (
                <span className="community-feed-card__initials">
                  {communityDisplayInitials(room.hostDisplayName)}
                </span>
              )}
            </span>
            <CountryFlag
              countryCode={room.hostCountryCode}
              className="community-feed-card__flag"
              size={20}
            />
          </span>
          <span className="community-feed-card__host-main">
            <span className="community-feed-card__name-row">
              <span className="community-feed-card__name">
                {room.isMine ? "You" : firstName}
              </span>
              {room.isMine ? (
                <span className="community-feed-card__status">
                  {pendingCount > 0
                    ? `${pendingCount} request${pendingCount === 1 ? "" : "s"}`
                    : "Your room"}
                </span>
              ) : null}
            </span>
            <span className="community-feed-card__meta-row">
              <span className="community-feed-card__avg">
                {hasAverage ? (
                  <>
                    3-dart avg{" "}
                    <span className="community-feed-card__avg-value">{averageValue}</span>
                  </>
                ) : (
                  "No avg yet"
                )}
              </span>
              {room.isMine ? (
                <span className="community-feed-card__code">Room {room.roomCode}</span>
              ) : null}
            </span>
          </span>
        </button>

        {room.isMine ? (
          <div className="community-feed-card__host-actions">
            {pendingCount > 0 ? (
              <button
                type="button"
                className="community-feed-card__cta community-feed-card__cta--alert"
                disabled={busy}
                onClick={() => onManageRoom?.(room.roomId)}
              >
                Review requests
              </button>
            ) : (
              <button
                type="button"
                className="community-feed-card__cta community-feed-card__cta--secondary"
                disabled={busy}
                onClick={() => onManageRoom?.(room.roomId)}
              >
                Waiting for players
              </button>
            )}
            <button
              type="button"
              className="community-feed-card__cta community-feed-card__cta--ghost"
              disabled={busy}
              onClick={() => onCloseRoom?.(room.roomId)}
            >
              Close room
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "community-feed-card__cta",
              room.alreadyRequested && "community-feed-card__cta--requested",
            )}
            disabled={busy || room.alreadyRequested || spotsLeft === 0}
            onClick={() => onRequestJoin(room.roomId)}
          >
            {room.alreadyRequested
              ? "Request sent"
              : spotsLeft === 0
                ? "Room full"
                : "Request to Join"}
          </button>
        )}
      </div>
    </article>
  );
}
