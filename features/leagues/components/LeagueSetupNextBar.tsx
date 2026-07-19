"use client";

interface LeagueSetupNextBarProps {
  disabled?: boolean;
  onNext: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
}

/** Shared setup controls for league detail tabs (Details → Rules → … → Schedule). */
export function LeagueSetupNextBar({
  disabled = false,
  onNext,
  onBack,
  nextLabel = "Next",
  backLabel = "Back",
}: LeagueSetupNextBarProps) {
  return (
    <div className="league-setup-next">
      {onBack ? (
        <button
          type="button"
          className="league-btn league-btn--ghost-dark"
          onClick={onBack}
          disabled={disabled}
        >
          {backLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="league-btn league-btn--primary"
        onClick={() => void onNext()}
        disabled={disabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}
