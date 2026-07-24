const DISMISSED_KEY = "player-upgrade-modal-dismissed";
export const PLAYER_UPGRADE_MODAL_OPEN_EVENT = "player-upgrade-modal:open";

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

/** Open the upgrade modal from menus / CTAs after it was dismissed. */
export function requestPlayerUpgradeModal(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(PLAYER_UPGRADE_MODAL_OPEN_EVENT));
}
