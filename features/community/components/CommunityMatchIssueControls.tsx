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

interface CommunityMatchPauseButtonProps {
  issueActive: boolean;
  busy?: boolean;
  onRaise: () => void;
  onResume: () => void;
}

/** Header control — pause / resume score-change mode. */
export function CommunityMatchPauseButton({
  issueActive,
  busy = false,
  onRaise,
  onResume,
}: CommunityMatchPauseButtonProps) {
  return (
    <button
      type="button"
      className={
        issueActive
          ? "community-match-header-btn community-match-header-btn--resume"
          : "community-match-header-btn community-match-header-btn--pause"
      }
      aria-label={issueActive ? "Resume match" : "Pause for score change"}
      disabled={busy}
      onClick={issueActive ? onResume : onRaise}
    >
      {issueActive ? <PlayIcon /> : <PauseIcon />}
    </button>
  );
}

interface CommunityMatchIssueBannerProps {
  issueActive: boolean;
  raiserName: string | null;
}

/** Floating guidance shown while the match is paused for a score change. */
export function CommunityMatchIssueBanner({
  issueActive,
  raiserName,
}: CommunityMatchIssueBannerProps) {
  if (!issueActive) {
    return null;
  }

  return (
    <div className="community-match-issue-banner" role="status">
      <p className="community-match-issue-banner__title">
        Paused for Score Change{raiserName ? ` - ${raiserName}` : ""}
      </p>
      <p className="community-match-issue-banner__copy">
        Tap Undo until you reach the incorrect dart. Enter the correct dart,
        then continue your turn. This works even after tapping Confirm Turn.
      </p>
    </div>
  );
}
