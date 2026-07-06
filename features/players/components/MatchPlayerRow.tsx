"use client";

import { TargetIcon } from "@/components/ui/AvatarPlaceholder";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  canRemovePlayers,
  isSlotFilled,
  MATCH_PLAYER_COLORS,
} from "@/features/players/lib/player-setup-utils";
import { DEFAULT_TEAM_NAMES } from "@/features/players/lib/team-display";
import type { PlayerSetupSlot } from "@/types/player-setup";
import { cn } from "@/utils/cn";

function PlusIcon() {
  return (
    <svg className="player-row__action-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="player-row__action-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.5 6h11M8 6V4.75h4V6M7.25 9v5M10 9v5M12.75 9v5M6.25 6l.5 9.25c0 .69.56 1.25 1.25 1.25h4c.69 0 1.25-.56 1.25-1.25L13.75 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MatchPlayerRowProps {
  placeholderLabel: string;
  slot: PlayerSetupSlot;
  color: string;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export function MatchPlayerRow({
  placeholderLabel,
  slot,
  color,
  canRemove,
  onAdd,
  onRemove,
}: MatchPlayerRowProps) {
  const filled = isSlotFilled(slot);

  return (
    <div className="player-row">
      {filled ? (
        <PlayerAvatar
          name={slot.name}
          color={color}
          avatarUrl={slot.avatarUrl}
          isGuest={slot.source === "guest" && !slot.avatarUrl}
        />
      ) : (
        <span className="player-avatar player-avatar--guest" aria-hidden>
          <TargetIcon className="player-avatar__icon" />
        </span>
      )}

      <span
        className={cn(
          "player-row__label",
          !filled && "player-row__label--placeholder",
        )}
      >
        {filled ? slot.name : placeholderLabel}
      </span>

      <div className="player-row__actions">
        {!filled ? (
          <button
            type="button"
            className="player-row__add"
            onClick={onAdd}
            aria-label={`Add ${placeholderLabel}`}
          >
            <PlusIcon />
          </button>
        ) : null}

        {canRemove ? (
          <button
            type="button"
            className="player-row__remove"
            onClick={onRemove}
            aria-label={filled ? `Remove ${slot.name}` : `Remove ${placeholderLabel}`}
          >
            <TrashIcon />
          </button>
        ) : !filled ? null : (
          <span className="player-row__spacer" aria-hidden />
        )}
      </div>
    </div>
  );
}

interface MatchTeamPlayersSectionProps {
  teamId: number;
  name: string;
  onNameChange: (name: string) => void;
  slots: PlayerSetupSlot[];
  canAdd: boolean;
  onAdd: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onOpenAddSheet: (teamId: number) => void;
}

export function MatchTeamPlayersSection({
  teamId,
  name,
  onNameChange,
  slots,
  canAdd,
  onAdd,
  onRemove,
  onOpenAddSheet,
}: MatchTeamPlayersSectionProps) {
  const teamEntries = slots
    .map((slot, slotIndex) => ({ slot, slotIndex }))
    .filter((entry) => entry.slot.teamId === teamId);

  return (
    <div className={cn("team-block", teamId === 1 && "team-block--second")}>
      <div className="team-block__header">
        <input
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={() => {
            if (!name.trim()) {
              onNameChange(DEFAULT_TEAM_NAMES[teamId as 0 | 1]);
            }
          }}
          className="setup-input setup-input--team-name"
          aria-label={`Team ${teamId + 1} name`}
          maxLength={24}
        />
      </div>

      {teamEntries.map(({ slot, slotIndex }) => (
        <MatchPlayerRow
          key={slot.id}
          placeholderLabel={`Player ${slotIndex + 1}`}
          slot={slot}
          color={slot.color ?? MATCH_PLAYER_COLORS[slotIndex % MATCH_PLAYER_COLORS.length]!}
          canRemove={canRemovePlayers(slots)}
          onAdd={() => onAdd(slot.id)}
          onRemove={() => onRemove(slot.id)}
        />
      ))}

      {canAdd ? (
        <button
          type="button"
          className="settings-row settings-row--action team-block__add"
          onClick={() => onOpenAddSheet(teamId)}
        >
          <span className="settings-row__action-label">Add player</span>
        </button>
      ) : null}
    </div>
  );
}
