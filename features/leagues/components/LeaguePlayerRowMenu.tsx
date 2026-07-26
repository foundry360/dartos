"use client";

import {
  LeagueRowCheckbox,
  LeagueRowMenu,
} from "@/features/leagues/components/LeagueRowMenu";

interface LeaguePlayerRowMenuProps {
  disabled?: boolean;
  onViewProfile: () => void;
  onEdit: () => void;
  onAssignTeam: () => void;
  onSendInvitation: () => void;
  onApprove?: () => void;
  onRemove: () => void;
}

export function LeaguePlayerRowMenu({
  disabled = false,
  onViewProfile,
  onEdit,
  onAssignTeam,
  onSendInvitation,
  onApprove,
  onRemove,
}: LeaguePlayerRowMenuProps) {
  return (
    <LeagueRowMenu
      disabled={disabled}
      label="Player actions"
      items={[
        { id: "view", label: "View Player Profile", onSelect: onViewProfile },
        ...(onApprove
          ? [{ id: "approve", label: "Approve Player", onSelect: onApprove }]
          : []),
        { id: "edit", label: "Edit Player", onSelect: onEdit },
        { id: "assign", label: "Assign Team", onSelect: onAssignTeam },
        { id: "invite", label: "Resend Invite", onSelect: onSendInvitation },
        {
          id: "remove",
          label: "Remove From League",
          onSelect: onRemove,
          danger: true,
        },
      ]}
    />
  );
}

export const LeaguePlayerCheckbox = LeagueRowCheckbox;
