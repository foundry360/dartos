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
  onRemove: () => void;
}

export function LeaguePlayerRowMenu({
  disabled = false,
  onViewProfile,
  onEdit,
  onAssignTeam,
  onSendInvitation,
  onRemove,
}: LeaguePlayerRowMenuProps) {
  return (
    <LeagueRowMenu
      disabled={disabled}
      label="Player actions"
      items={[
        { id: "view", label: "View Player Profile", onSelect: onViewProfile },
        { id: "edit", label: "Edit Player", onSelect: onEdit },
        { id: "assign", label: "Assign Team", onSelect: onAssignTeam },
        { id: "invite", label: "Send Invitation", onSelect: onSendInvitation },
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
