const STORAGE_KEY = "dartos:league-player-cards:recent";
const MAX_STORED = 20;

export const LEAGUE_PLAYER_CARD_RECENT_CHANGED_EVENT =
  "dartos:league-player-cards-recent-changed";

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const id = entry.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_STORED) {
      break;
    }
  }

  return ids;
}

export function readRecentLeaguePlayerCardIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return sanitizeIds(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function recordRecentLeaguePlayerCard(playerId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const id = playerId.trim();
  if (!id) {
    return;
  }

  try {
    const next = sanitizeIds([id, ...readRecentLeaguePlayerCardIds()]);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(LEAGUE_PLAYER_CARD_RECENT_CHANGED_EVENT));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
