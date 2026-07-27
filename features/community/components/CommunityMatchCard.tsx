"use client";

import { AvatarPlaceholder } from "@/components/ui/AvatarPlaceholder";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { communityFirstName } from "@/features/community/lib/community-name";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import type { CommunityPublicProfile } from "@/lib/supabase/queries/community-profile";
import { cn } from "@/utils/cn";

interface SeatView {
  userId: string | null;
  profile: CommunityPublicProfile | null;
  label: string;
  emptyLabel: string;
}

interface CommunityMatchCardProps {
  roomCode: string;
  formatLabel?: string | null;
  statusLabel?: string | null;
  hostSeat: SeatView;
  guestSeat: SeatView;
  onSelectPlayer: (userId: string) => void;
}

function Seat({
  seat,
  onSelectPlayer,
}: {
  seat: SeatView;
  onSelectPlayer: (userId: string) => void;
}) {
  const filled = Boolean(seat.userId && seat.profile);
  const firstName = communityFirstName(seat.profile?.displayName, seat.label);

  if (!filled || !seat.userId) {
    return (
      <div className="community-match-card__seat community-match-card__seat--empty">
        <span className="community-match-card__avatar community-match-card__avatar--empty" aria-hidden>
          <AvatarPlaceholder iconClassName="community-match-card__avatar-icon" />
        </span>
        <div className="community-match-card__seat-copy">
          <p className="community-match-card__seat-name">{seat.emptyLabel}</p>
          <p className="community-match-card__seat-meta">Open seat</p>
        </div>
      </div>
    );
  }

  const avatarUrl = seat.profile?.avatarUrl;

  return (
    <button
      type="button"
      className="community-match-card__seat"
      onClick={() => onSelectPlayer(seat.userId!)}
    >
      <span className="community-match-card__avatar-wrap">
        <span className="community-match-card__avatar" aria-hidden>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" />
          ) : (
            <HomeRecentMatchDartboard className="community-match-card__dartboard" />
          )}
        </span>
        <CountryFlag
          countryCode={seat.profile?.countryCode}
          className="community-match-card__flag"
          title="Country"
          size={20}
        />
      </span>
      <div className="community-match-card__seat-copy">
        <p className="community-match-card__seat-name">{firstName}</p>
        <p className="community-match-card__seat-meta">
          {seat.profile?.threeDartAverage
            ? `${seat.profile.threeDartAverage.toFixed(1)} avg`
            : "Tap for profile"}
        </p>
      </div>
    </button>
  );
}

export function CommunityMatchCard({
  roomCode,
  formatLabel,
  statusLabel,
  hostSeat,
  guestSeat,
  onSelectPlayer,
}: CommunityMatchCardProps) {
  const resolvedStatus = statusLabel ?? (guestSeat.userId ? "Ready" : "Lobby");

  return (
    <section className={cn("community-match-card")} aria-label="Match">
      <header className="community-match-card__header">
        <div>
          <p className="community-match-card__eyebrow">Room</p>
          <h3 className="community-match-card__code">{roomCode}</h3>
          {formatLabel ? (
            <p className="community-match-card__format">{formatLabel}</p>
          ) : null}
        </div>
        <p className="community-match-card__status">{resolvedStatus}</p>
      </header>

      <div className="community-match-card__seats">
        <Seat seat={hostSeat} onSelectPlayer={onSelectPlayer} />
        <div className="community-match-card__vs" aria-hidden>
          vs
        </div>
        <Seat seat={guestSeat} onSelectPlayer={onSelectPlayer} />
      </div>
    </section>
  );
}
