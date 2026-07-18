import {
  resolveLeagueRulesForMatches,
  type X01MatchFormat,
} from "@/features/leagues/lib/league-game-rules";
import type { LeagueRow } from "@/lib/supabase/database.types";

function unitsToWinFromX01MatchFormat(format: X01MatchFormat): number {
  switch (format) {
    case "best_of_3":
      return 2;
    case "best_of_5":
      return 3;
    case "best_of_7":
      return 4;
    case "first_to_3":
      return 3;
    case "first_to_5":
      return 5;
  }
}

function unitsToWinFromBestOfGames(
  format: "best_of_3" | "best_of_5" | "best_of_7",
): number {
  switch (format) {
    case "best_of_3":
      return 2;
    case "best_of_5":
      return 3;
    case "best_of_7":
      return 4;
  }
}

/** Legs (X01) or games (Cricket/Tactics) needed to win the match. */
export function getLeagueMatchUnitsToWin(
  league: Pick<LeagueRow, "game_format" | "rules" | "format">,
): number {
  const rules = resolveLeagueRulesForMatches(league);
  if (!rules) {
    return 1;
  }

  if (rules.family === "x01") {
    return rules.matchFormat
      ? unitsToWinFromX01MatchFormat(rules.matchFormat)
      : 1;
  }

  if (rules.family === "cricket" || rules.family === "tactics") {
    return rules.matchFormat
      ? unitsToWinFromBestOfGames(rules.matchFormat)
      : 1;
  }

  // Mixed / custom — no single match format at the top level.
  return 1;
}

/**
 * Final scoreline when awarding a match without full board completion
 * (forfeit, walkover, award win).
 *
 * Winner is filled up to the format win target; loser keeps legs/games
 * already won, capped below the win target (e.g. best of 5 from 0–0 → 3–0).
 */
export function awardedMatchScoreline(input: {
  winnerSide: "home" | "away";
  unitsToWin: number;
  currentHomeScore?: number;
  currentAwayScore?: number;
}): { homeScore: number; awayScore: number } {
  const target = Math.max(1, Math.floor(input.unitsToWin));
  const home = Math.max(0, Math.floor(input.currentHomeScore ?? 0));
  const away = Math.max(0, Math.floor(input.currentAwayScore ?? 0));
  const loserCap = Math.max(0, target - 1);

  if (input.winnerSide === "home") {
    return {
      homeScore: Math.max(home, target),
      awayScore: Math.min(away, loserCap),
    };
  }

  return {
    homeScore: Math.min(home, loserCap),
    awayScore: Math.max(away, target),
  };
}
