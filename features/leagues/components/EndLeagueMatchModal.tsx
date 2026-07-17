"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

export type EndMatchReason =
  | "award_win"
  | "forfeit"
  | "walkover"
  | "cancel";

export type EndMatchResult = {
  reason: EndMatchReason;
  winnerSide: "home" | "away" | null;
};

const END_REASONS: Array<{
  id: EndMatchReason;
  label: string;
  description: string;
  needsWinner: boolean;
}> = [
  {
    id: "award_win",
    label: "Award win",
    description: "Record a winner without board scoring.",
    needsWinner: true,
  },
  {
    id: "forfeit",
    label: "Forfeit",
    description: "One side forfeits; award the match to the other.",
    needsWinner: true,
  },
  {
    id: "walkover",
    label: "Walkover / no-show",
    description: "Opponent did not appear; award the match.",
    needsWinner: true,
  },
  {
    id: "cancel",
    label: "Cancel match",
    description: "End with no winner. Match will not count as a result.",
    needsWinner: false,
  },
];

interface EndLeagueMatchModalProps {
  open: boolean;
  homeLabel: string;
  awayLabel: string;
  matchLabel: string;
  matchNumber: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (result: EndMatchResult) => void;
}

export function EndLeagueMatchModal({
  open,
  homeLabel,
  awayLabel,
  matchLabel,
  matchNumber,
  busy = false,
  onClose,
  onConfirm,
}: EndLeagueMatchModalProps) {
  const [reason, setReason] = useState<EndMatchReason | null>(null);
  const [winnerSide, setWinnerSide] = useState<"home" | "away" | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setReason(null);
    setWinnerSide(null);
  }, [open]);

  const selected = END_REASONS.find((entry) => entry.id === reason);
  const needsWinner = selected?.needsWinner ?? false;
  const canConfirm =
    !busy && reason != null && (!needsWinner || winnerSide != null);

  const close = () => {
    if (busy) {
      return;
    }
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      title="End match"
      onClose={close}
      className="league-end-match-modal"
    >
      <div className="sheet-form league-end-match-modal__body">
        <p className="settings-panel__subdescription">
          End Match {matchNumber} - <strong>{matchLabel}</strong> without board
          scoring. Use this for forfeits, walkovers, or results recorded off the
          board.
        </p>

        <fieldset className="league-end-match-modal__reasons">
          <legend className="league-end-match-modal__legend">
            How should this match end?
          </legend>
          <div className="league-end-match-modal__reason-list">
            {END_REASONS.map((entry) => {
              const active = reason === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={cn(
                    "league-end-match-modal__reason",
                    active && "is-active",
                  )}
                  aria-pressed={active}
                  disabled={busy}
                  onClick={() => {
                    setReason(entry.id);
                    if (!entry.needsWinner) {
                      setWinnerSide(null);
                    }
                  }}
                >
                  <span className="league-end-match-modal__reason-label">
                    {entry.label}
                  </span>
                  <span className="league-end-match-modal__reason-desc">
                    {entry.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {needsWinner ? (
          <fieldset className="league-end-match-modal__winner">
            <legend className="league-end-match-modal__legend">
              {reason === "forfeit"
                ? "Winner (other side forfeits)"
                : reason === "walkover"
                  ? "Winner (opponent no-show)"
                  : "Award match to"}
            </legend>
            <div className="league-end-match-modal__winner-row">
              <button
                type="button"
                className={cn(
                  "league-end-match-modal__winner-btn",
                  winnerSide === "home" && "is-active",
                )}
                aria-pressed={winnerSide === "home"}
                disabled={busy}
                onClick={() => setWinnerSide("home")}
              >
                {homeLabel}
              </button>
              <button
                type="button"
                className={cn(
                  "league-end-match-modal__winner-btn",
                  winnerSide === "away" && "is-active",
                )}
                aria-pressed={winnerSide === "away"}
                disabled={busy}
                onClick={() => setWinnerSide("away")}
              >
                {awayLabel}
              </button>
            </div>
          </fieldset>
        ) : null}

        <div className="league-end-match-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </TouchButton>
          <TouchButton
            type="button"
            fullWidth
            size="lg"
            disabled={!canConfirm}
            onClick={() => {
              if (!reason) {
                return;
              }
              onConfirm({
                reason,
                winnerSide: needsWinner ? winnerSide : null,
              });
            }}
          >
            {busy ? "Ending…" : "End Match"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
