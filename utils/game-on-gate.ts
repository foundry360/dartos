/**
 * Hard gate for match-start "Game on … to throw".
 * Leave / End match / Back to Home must block playback even if an iOS gesture
 * unlocks audio before the click handler runs.
 */

let gameOnPlaybackBlocked = false;
let gameOnGateGeneration = 0;
/** Once dismissed/finished for a matchId, never re-arm intro for that match. */
const permanentlyBlockedMatchIds = new Set<string>();

export function blockGameOnAnnouncements(matchId?: string | null): void {
  gameOnPlaybackBlocked = true;
  gameOnGateGeneration += 1;
  if (matchId) {
    permanentlyBlockedMatchIds.add(matchId);
  }
}

/**
 * Allow Game On again when a new playing match arms its intro.
 * Returns false if this match was already dismissed/finished.
 */
export function armGameOnAnnouncements(matchId?: string | null): boolean {
  if (matchId && permanentlyBlockedMatchIds.has(matchId)) {
    return false;
  }

  gameOnPlaybackBlocked = false;
  return true;
}

export function isGameOnPlaybackBlocked(): boolean {
  return gameOnPlaybackBlocked;
}

/** True only if this matchId was dismissed/finished — ignores the global leave gate. */
export function isGameOnPermanentlyBlockedForMatch(
  matchId?: string | null,
): boolean {
  if (!matchId) {
    return false;
  }

  return permanentlyBlockedMatchIds.has(matchId);
}

export function isGameOnBlockedForMatch(matchId?: string | null): boolean {
  if (!matchId) {
    return gameOnPlaybackBlocked;
  }

  return gameOnPlaybackBlocked || permanentlyBlockedMatchIds.has(matchId);
}

export function getGameOnGateGeneration(): number {
  return gameOnGateGeneration;
}

export function isGameOnGateChangedSince(sinceGeneration: number): boolean {
  return sinceGeneration !== gameOnGateGeneration;
}
