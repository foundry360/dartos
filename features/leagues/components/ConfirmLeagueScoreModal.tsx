"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";
import "@/features/leagues/league-detail.css";

interface ConfirmLeagueScoreModalProps {
  open: boolean;
  winnerName: string;
  homeLabel: string;
  awayLabel: string;
  homeScore: number;
  awayScore: number;
  winnerSide: "home" | "away";
  matchLabel: string;
  weekLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmLeagueScoreModal({
  open,
  winnerName,
  homeLabel,
  awayLabel,
  homeScore,
  awayScore,
  winnerSide,
  matchLabel,
  weekLabel,
  busy = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmLeagueScoreModalProps) {
  return (
    <BottomSheet
      open={open}
      title="Match Complete"
      onClose={busy ? () => undefined : onClose}
      className="confirm-league-score-modal create-venue-modal confirm-dialog-modal"
      overlayClassName="confirm-league-score-modal__overlay"
    >
      <div className="sheet-form create-venue-modal__body confirm-league-score-modal__body">
        <p className="confirm-league-score-modal__eyebrow">
          {weekLabel ? `${weekLabel} · ` : null}
          {matchLabel}
        </p>
        <p className="confirm-league-score-modal__winner">{winnerName} wins</p>
        <p className="confirm-league-score-modal__scoreline" aria-label="Final score">
          <span
            className={cn(
              "confirm-league-score-modal__side",
              winnerSide === "home" && "is-winner",
            )}
          >
            <span className="confirm-league-score-modal__side-name">{homeLabel}</span>
            <span className="confirm-league-score-modal__side-score">{homeScore}</span>
          </span>
          <span className="confirm-league-score-modal__vs" aria-hidden>
            –
          </span>
          <span
            className={cn(
              "confirm-league-score-modal__side",
              winnerSide === "away" && "is-winner",
            )}
          >
            <span className="confirm-league-score-modal__side-score">{awayScore}</span>
            <span className="confirm-league-score-modal__side-name">{awayLabel}</span>
          </span>
        </p>
        <p className="settings-panel__subdescription confirm-league-score-modal__copy">
          Confirm to record this result for standings and statistics, then return
          to League Night.
        </p>

        {error ? (
          <p className="league-rules__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="confirm-league-score-modal__actions">
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={busy}
            onClick={onClose}
          >
            Not yet
          </TouchButton>
          <TouchButton
            type="button"
            fullWidth
            size="lg"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Recording…" : "Confirm Score"}
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
