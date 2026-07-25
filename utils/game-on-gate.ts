/**
 * Hard gate for match-start "Game on … to throw".
 * Leave / End match / Back to Home must block playback even if an iOS gesture
 * unlocks audio before the click handler runs.
 */

let gameOnPlaybackBlocked = false;
let gameOnGateGeneration = 0;

export function blockGameOnAnnouncements(): void {
  gameOnPlaybackBlocked = true;
  gameOnGateGeneration += 1;
}

/** Allow Game On again when a new playing match arms its intro. */
export function armGameOnAnnouncements(): void {
  gameOnPlaybackBlocked = false;
}

export function isGameOnPlaybackBlocked(): boolean {
  return gameOnPlaybackBlocked;
}

export function getGameOnGateGeneration(): number {
  return gameOnGateGeneration;
}

export function isGameOnGateChangedSince(sinceGeneration: number): boolean {
  return sinceGeneration !== gameOnGateGeneration;
}
