"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { LeagueNightSelect } from "@/features/leagues/components/LeagueNightSelect";
import {
  formatBoardUnavailableCopy,
  listUnoccupiedBoards,
  type LeagueNightMatchControl,
} from "@/features/leagues/lib/league-night";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";

interface BoardUnavailableModalProps {
  open: boolean;
  board: number | null;
  occupant: DraftLeagueMatch | null;
  /** Match the director was trying to assign / take live. */
  match: DraftLeagueMatch | null;
  matches: DraftLeagueMatch[];
  matchControls: Record<string, LeagueNightMatchControl>;
  boardCount: number;
  onClose: () => void;
  onSave: (nextBoard: number) => void;
}

export function BoardUnavailableModal({
  open,
  board,
  occupant,
  match,
  matches,
  matchControls,
  boardCount,
  onClose,
  onSave,
}: BoardUnavailableModalProps) {
  const copy =
    board != null && occupant
      ? formatBoardUnavailableCopy({ board, occupant })
      : null;

  const availableBoards = useMemo(
    () =>
      listUnoccupiedBoards({
        boardCount,
        matches,
        matchControls,
        excludeMatchKey: match?.key,
      }),
    [boardCount, match?.key, matchControls, matches],
  );

  const [selectedBoard, setSelectedBoard] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setSelectedBoard("");
      return;
    }
    setSelectedBoard(
      availableBoards[0] != null ? String(availableBoards[0]) : "",
    );
  }, [open, availableBoards]);

  const canSave = selectedBoard !== "" && Number.isFinite(Number(selectedBoard));

  return (
    <BottomSheet
      open={open}
      title={copy?.title ?? "Board Unavailable"}
      onClose={onClose}
      className="board-unavailable-modal create-venue-modal"
    >
      <div className="sheet-form create-venue-modal__body board-unavailable-modal__body">
        {copy ? (
          <div className="board-unavailable-modal__copy">
            <p>
              <strong>{copy.boardLabel}</strong> {copy.lead}
            </p>
            <p>
              <strong>{copy.matchLabel}</strong> {copy.status}
            </p>
            <p>{copy.guidance}</p>
          </div>
        ) : null}

        <label className="board-unavailable-modal__field">
          <span className="board-unavailable-modal__label">Available board</span>
          {availableBoards.length > 0 ? (
            <LeagueNightSelect
              ariaLabel="Select an available board"
              value={selectedBoard}
              allowClear={false}
              options={availableBoards.map((option) => ({
                value: String(option),
                label: `Board ${option}`,
              }))}
              onChange={setSelectedBoard}
            />
          ) : (
            <p className="board-unavailable-modal__empty">
              No unoccupied boards are available right now.
            </p>
          )}
        </label>

        <div className="board-unavailable-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            onClick={onClose}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="button"
            fullWidth
            size="lg"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) {
                return;
              }
              onSave(Number(selectedBoard));
            }}
          >
            Save
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
