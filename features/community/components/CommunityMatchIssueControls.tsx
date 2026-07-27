"use client";

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8.25 5.25v13.5l11.25-6.75L8.25 5.25z" />
    </svg>
  );
}

interface CommunityMatchIssueControlsProps {
  issueActive: boolean;
  raiserName: string | null;
  busy?: boolean;
  onRaise: () => void;
  onResume: () => void;
}

export function CommunityMatchIssueControls({
  issueActive,
  raiserName,
  busy = false,
  onRaise,
  onResume,
}: CommunityMatchIssueControlsProps) {
  return (
    <div className="community-match-fab">
      {issueActive ? (
        <div className="community-match-issue-banner" role="status">
          <p className="community-match-issue-banner__title">
            Paused for Score Change{raiserName ? ` - ${raiserName}` : ""}
          </p>
          <p className="community-match-issue-banner__copy">
            Tap Undo until you reach the incorrect dart. Enter the correct dart,
            then continue your turn. This works even after tapping Confirm Turn.
          </p>
        </div>
      ) : null}

      {issueActive ? (
        <button
          type="button"
          className="community-match-fab__btn community-match-fab__btn--resume"
          aria-label="Resume match"
          disabled={busy}
          onClick={onResume}
        >
          <PlayIcon />
        </button>
      ) : (
        <button
          type="button"
          className="community-match-fab__btn community-match-fab__btn--issue"
          aria-label="Pause for score change"
          disabled={busy}
          onClick={onRaise}
        >
          <PauseIcon />
        </button>
      )}
    </div>
  );
}
