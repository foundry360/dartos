"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

export type MatchCompleteOutcome = "game" | "set" | "match";

interface MatchCompletePanelProps {
  open: boolean;
  winnerName: string;
  /** What was just won. Defaults to full match. */
  outcome?: MatchCompleteOutcome;
  onHome: () => void;
  onRematch: () => void;
  /** Optional continue action for game/set wins (keeps playing). */
  onContinue?: () => void;
  continueLabel?: string;
  homeLabel?: string;
  rematchLabel?: string;
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("match-complete-modal__trophy", className)}
      aria-hidden
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M5 5H3v1a3 3 0 0 0 3 3" />
      <path d="M19 5h2v1a3 3 0 0 1-3 3" />
    </svg>
  );
}

function outcomeCopy(outcome: MatchCompleteOutcome, winnerName: string) {
  switch (outcome) {
    case "game":
      return {
        title: "Game Complete!",
        headline: `${winnerName} Wins!`,
        description: `Congratulations! ${winnerName} has won the game.`,
      };
    case "set":
      return {
        title: "Set Complete!",
        headline: `${winnerName} Wins!`,
        description: `Congratulations! ${winnerName} has won the set.`,
      };
    case "match":
    default:
      return {
        title: "Match Complete!",
        headline: `${winnerName} Wins!`,
        description: `Congratulations! ${winnerName} has won the match.`,
      };
  }
}

export function MatchCompletePanel({
  open,
  winnerName,
  outcome = "match",
  onHome,
  onRematch,
  onContinue,
  continueLabel = "Continue",
  homeLabel = "Back to Home",
  rematchLabel = "Rematch",
}: MatchCompletePanelProps) {
  const copy = outcomeCopy(outcome, winnerName);
  const isFinal = outcome === "match" || !onContinue;

  return (
    <BottomSheet
      open={open}
      title={copy.title}
      onClose={isFinal ? onHome : onContinue!}
      className="confirm-dialog-modal create-venue-modal match-complete-modal"
    >
      <div className="confirm-dialog-modal__body create-venue-modal__body match-complete-modal__body confirm-dialog-modal__body--center">
        <div className="confirm-dialog-modal__description match-complete-modal__description">
          <p className="match-complete-modal__winner">
            <TrophyIcon />
            <span>{copy.headline}</span>
          </p>
          <p className="match-complete-modal__congrats">{copy.description}</p>
        </div>

        {isFinal ? (
          <div className="confirm-dialog-modal__actions match-complete-modal__actions">
            <TouchButton variant="secondary" size="lg" fullWidth onClick={onHome}>
              {homeLabel}
            </TouchButton>
            <TouchButton variant="primary" size="lg" fullWidth onClick={onRematch}>
              {rematchLabel}
            </TouchButton>
          </div>
        ) : (
          <div className="confirm-dialog-modal__actions confirm-dialog-modal__actions--single">
            <TouchButton variant="primary" size="lg" fullWidth onClick={onContinue}>
              {continueLabel}
            </TouchButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
