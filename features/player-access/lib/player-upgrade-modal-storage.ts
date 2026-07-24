const DISMISSED_KEY = "player-upgrade-modal-dismissed";

export function wasPlayerUpgradeModalDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPlayerUpgradeModal(): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Ignore storage errors.
  }
}

/** Call on each player login so the upgrade modal shows again. */
export function resetPlayerUpgradeModalForLogin(): void {
  try {
    sessionStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Ignore storage errors.
  }
}
