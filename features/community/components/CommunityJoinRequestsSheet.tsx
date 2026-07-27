"use client";

import { AvatarPlaceholder } from "@/components/ui/AvatarPlaceholder";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { communityFirstName } from "@/features/community/lib/community-name";
import type { CommunityJoinRequest } from "@/lib/supabase/queries/community-rooms";

interface CommunityJoinRequestsSheetProps {
  open: boolean;
  roomCode: string;
  requests: CommunityJoinRequest[];
  busy?: boolean;
  onClose: () => void;
  onSelectPlayer: (userId: string) => void;
  onRespond: (requestId: string, accept: boolean) => void;
}

export function CommunityJoinRequestsSheet({
  open,
  roomCode,
  requests,
  busy = false,
  onClose,
  onSelectPlayer,
  onRespond,
}: CommunityJoinRequestsSheetProps) {
  return (
    <BottomSheet
      open={open}
      title={`Room ${roomCode}`}
      onClose={onClose}
      className="community-requests-sheet"
    >
      <div className="community-requests-sheet__body">
        {requests.length === 0 ? (
          <p className="community-room__empty">No pending join requests.</p>
        ) : (
          <div className="community-room__request-list">
            {requests.map((request) => {
              const name = communityFirstName(request.requesterDisplayName);
              return (
                <div key={request.requestId} className="community-join-request">
                  <button
                    type="button"
                    className="community-join-request__person"
                    onClick={() => onSelectPlayer(request.requesterId)}
                  >
                    <span className="community-join-request__avatar-wrap">
                      <span className="community-join-request__avatar" aria-hidden>
                        {request.requesterAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={request.requesterAvatarUrl} alt="" />
                        ) : (
                          <AvatarPlaceholder iconClassName="community-join-request__avatar-icon" />
                        )}
                      </span>
                      <CountryFlag
                        countryCode={request.requesterCountryCode}
                        className="community-join-request__flag"
                        size={20}
                      />
                    </span>
                    <span className="community-join-request__copy">
                      <span className="community-join-request__name">{name}</span>
                      <span className="community-join-request__meta">
                        {request.requesterThreeDartAverage > 0
                          ? `${request.requesterThreeDartAverage.toFixed(1)} avg`
                          : "Tap for profile"}
                      </span>
                    </span>
                  </button>
                  <div className="community-join-request__actions">
                    <TouchButton
                      type="button"
                      size="md"
                      disabled={busy}
                      onClick={() => onRespond(request.requestId, true)}
                    >
                      Accept
                    </TouchButton>
                    <TouchButton
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={busy}
                      onClick={() => onRespond(request.requestId, false)}
                    >
                      Decline
                    </TouchButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
