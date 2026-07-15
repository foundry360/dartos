"use client";

import {
  LeagueRowCheckbox,
  LeagueRowMenu,
} from "@/features/leagues/components/LeagueRowMenu";

interface LeagueTeamRowMenuProps {
  disabled?: boolean;
  onView: () => void;
  onEdit: () => void;
  onAssignPlayers: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
  statusLabel: string;
}

export function LeagueTeamRowMenu({
  disabled = false,
  onView,
  onEdit,
  onAssignPlayers,
  onToggleStatus,
  onRemove,
  statusLabel,
}: LeagueTeamRowMenuProps) {
  return (
    <LeagueRowMenu
      disabled={disabled}
      label="Team actions"
      items={[
        { id: "view", label: "View Team", onSelect: onView },
        { id: "edit", label: "Edit Team", onSelect: onEdit },
        { id: "assign", label: "Assign Players", onSelect: onAssignPlayers },
        { id: "status", label: statusLabel, onSelect: onToggleStatus },
        { id: "remove", label: "Delete Team", onSelect: onRemove, danger: true },
      ]}
    />
  );
}

export const LeagueTeamCheckbox = LeagueRowCheckbox;
