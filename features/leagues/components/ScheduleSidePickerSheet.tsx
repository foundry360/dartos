"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ScheduleParticipant } from "@/features/leagues/lib/league-schedule";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

export interface ScheduleSidePickerOption {
  participant: ScheduleParticipant;
  name: string;
  color: string;
  avatarUrl: string | null;
}

interface ScheduleSidePickerSheetProps {
  open: boolean;
  title: string;
  options: ScheduleSidePickerOption[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (participant: ScheduleParticipant) => void;
}

export function ScheduleSidePickerSheet({
  open,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
}: ScheduleSidePickerSheetProps) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="schedule-side-picker">
        {options.length === 0 ? (
          <p className="schedule-side-picker__empty">No replacements available.</p>
        ) : (
          <ul className="schedule-side-picker__list">
            {options.map(({ participant, name, color, avatarUrl }) => {
              const selected = participant.id === selectedId;

              return (
                <li key={participant.id}>
                  <button
                    type="button"
                    className={
                      selected
                        ? "schedule-side-picker__option is-selected"
                        : "schedule-side-picker__option"
                    }
                    onClick={() => onSelect(participant)}
                  >
                    <PlayerAvatar
                      name={name}
                      color={color || APP_PRIMARY_COLOR}
                      avatarUrl={avatarUrl}
                    />
                    <span className="schedule-side-picker__label">
                      {participant.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
