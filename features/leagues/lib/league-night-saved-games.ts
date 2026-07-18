import type { X01GameState } from "@/types/x01";
import type { CricketGameState } from "@/types/cricket";

export type LeagueNightSavedBoardGame = {
  gameMode: "x01" | "cricket";
  gameState: X01GameState | CricketGameState;
  savedAt: string;
};

type LeagueNightSavedGamesFile = {
  version: 1;
  byMatchKey: Record<string, LeagueNightSavedBoardGame>;
};

const storageKey = (leagueId: string) =>
  `dartos:league-night-board-games:${leagueId}`;

function emptyFile(): LeagueNightSavedGamesFile {
  return { version: 1, byMatchKey: {} };
}

function readFile(leagueId: string): LeagueNightSavedGamesFile {
  if (typeof window === "undefined") {
    return emptyFile();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(leagueId));
    if (!raw) {
      return emptyFile();
    }
    const parsed = JSON.parse(raw) as LeagueNightSavedGamesFile;
    if (!parsed || parsed.version !== 1 || typeof parsed.byMatchKey !== "object") {
      return emptyFile();
    }
    return {
      version: 1,
      byMatchKey: parsed.byMatchKey ?? {},
    };
  } catch {
    return emptyFile();
  }
}

function writeFile(leagueId: string, file: LeagueNightSavedGamesFile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(leagueId), JSON.stringify(file));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** Persist an in-progress board game so Resume survives page refresh. */
export function saveLeagueNightBoardGame(
  leagueId: string | undefined,
  matchKey: string,
  gameMode: "x01" | "cricket",
  gameState: X01GameState | CricketGameState,
): void {
  if (!leagueId || gameState.status !== "playing") {
    return;
  }

  const file = readFile(leagueId);
  file.byMatchKey[matchKey] = {
    gameMode,
    gameState,
    savedAt: new Date().toISOString(),
  };
  writeFile(leagueId, file);
}

export function readLeagueNightBoardGame(
  leagueId: string | undefined,
  matchKey: string,
): LeagueNightSavedBoardGame | null {
  if (!leagueId) {
    return null;
  }
  return readFile(leagueId).byMatchKey[matchKey] ?? null;
}

export function clearLeagueNightBoardGame(
  leagueId: string | undefined,
  matchKey: string,
): void {
  if (!leagueId) {
    return;
  }
  const file = readFile(leagueId);
  if (!(matchKey in file.byMatchKey)) {
    return;
  }
  delete file.byMatchKey[matchKey];
  writeFile(leagueId, file);
}
