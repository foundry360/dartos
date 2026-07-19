import type { CricketVariant, X01GameType } from "@/lib/constants";
import {
  formatLeagueGameFormatLabel,
  normalizeLeagueGameFormat,
} from "@/features/leagues/lib/league-formats";
import {
  formatLeagueRulesSummaryRows,
  leagueHasSavedRules,
  resolveLeagueRulesForMatches,
  type CricketLeagueRules,
  type LeagueGameRules,
  type X01LeagueRules,
  type X01MatchFormat,
} from "@/features/leagues/lib/league-game-rules";
import type { LeaguePlayer } from "@/features/leagues/lib/league-players";
import { leaguePlayerDisplayName } from "@/features/leagues/lib/league-players";
import type { DraftLeagueMatch } from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import type { LeagueRow } from "@/lib/supabase/database.types";
import type {
  CricketMatchSetup,
  MatchStartingPlayerRule,
  MatchTeamNames,
  PlayerSetupSlot,
  X01MatchSetup,
} from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";

export type LeaguePlayableSetup =
  | { kind: "x01"; setup: X01MatchSetup; playHref: string }
  | { kind: "cricket"; setup: CricketMatchSetup; playHref: string };

function legsToWinFromX01MatchFormat(format: X01MatchFormat): number {
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

function legsToWinFromBestOfGames(
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

function mapX01InRule(rule: X01LeagueRules["startingRule"]): X01InRule {
  // Engine supports straight/double in; master in maps to double in for now.
  return rule === "straight_in" ? "straight_in" : "double_in";
}

function mapX01OutRule(rule: X01LeagueRules["finishingRule"]): X01OutRule {
  // Engine supports straight/double out; master out maps to double out for now.
  return rule === "straight_out" ? "straight_out" : "double_out";
}

function mapStartingPlayer(input: {
  startingPlayer: string | null;
  homeIndex?: number;
  awayIndex?: number;
}): {
  startingPlayerRule: MatchStartingPlayerRule;
  coinTossStarterIndex?: number;
} {
  switch (input.startingPlayer) {
    case "home":
      return {
        startingPlayerRule: "coin_toss",
        coinTossStarterIndex: input.homeIndex ?? 0,
      };
    case "away":
      return {
        startingPlayerRule: "coin_toss",
        coinTossStarterIndex: input.awayIndex ?? 1,
      };
    case "alternate_legs":
    case "alternate_games":
      return { startingPlayerRule: "rotate_each_leg" };
    case "coin_toss":
    default:
      return {
        startingPlayerRule: "coin_toss",
        coinTossStarterIndex: Math.random() < 0.5 ? 0 : 1,
      };
  }
}

function resolveX01GameType(rules: X01LeagueRules): X01GameType | null {
  const score = rules.startingScore;
  if (score === 201 || score === 301 || score === 501 || score === 701) {
    return score;
  }
  return null;
}

function mapCricketVariant(
  rules: CricketLeagueRules,
): { variant: CricketVariant; cutThroat: boolean } {
  return {
    variant: "classic",
    cutThroat: rules.cricketVariant === "cut_throat",
  };
}

function sideSlot(input: {
  id: string | null;
  label: string;
  kind: "team" | "player";
  teamId: number;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
}): PlayerSetupSlot {
  if (input.kind === "player" && input.id) {
    const player = input.playersById.get(input.id);
    if (player) {
      return {
        id: player.id,
        name: leaguePlayerDisplayName(player),
        nickname: player.nickname,
        source: player.savedPlayerId || player.profileUserId ? "profile" : "guest",
        profileId: player.savedPlayerId ?? player.profileUserId ?? undefined,
        color: player.color,
        avatarUrl: player.avatarUrl ?? undefined,
        teamId: input.teamId,
        filled: true,
      };
    }
  }

  if (input.kind === "team" && input.id) {
    const team = input.teamsById.get(input.id);
    if (team) {
      return {
        id: team.id,
        name: team.name,
        source: "guest",
        color: team.color,
        teamId: input.teamId,
        filled: true,
      };
    }
  }

  return {
    id: input.id ?? `side-${input.teamId}`,
    name: input.label || `Side ${input.teamId + 1}`,
    source: "guest",
    teamId: input.teamId,
    filled: true,
  };
}

function playerSlotFromId(input: {
  playerId: string;
  teamId: number;
  playersById: Map<string, LeaguePlayer>;
}): PlayerSetupSlot | null {
  const player = input.playersById.get(input.playerId);
  if (!player) {
    return null;
  }
  return {
    id: player.id,
    name: leaguePlayerDisplayName(player),
    nickname: player.nickname,
    source: player.savedPlayerId || player.profileUserId ? "profile" : "guest",
    profileId: player.savedPlayerId ?? player.profileUserId ?? undefined,
    color: player.color,
    avatarUrl: player.avatarUrl ?? undefined,
    teamId: input.teamId,
    filled: true,
  };
}

function buildPlayersForMatch(input: {
  match: DraftLeagueMatch;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  homePlayerIds?: string[];
  awayPlayerIds?: string[];
}): PlayerSetupSlot[] {
  const homeIds = (input.homePlayerIds ?? []).filter(Boolean);
  const awayIds = (input.awayPlayerIds ?? []).filter(Boolean);

  if (homeIds.length > 0 && awayIds.length > 0) {
    const homeSlots = homeIds
      .map((playerId) =>
        playerSlotFromId({
          playerId,
          teamId: 0,
          playersById: input.playersById,
        }),
      )
      .filter((slot): slot is PlayerSetupSlot => slot != null);
    const awaySlots = awayIds
      .map((playerId) =>
        playerSlotFromId({
          playerId,
          teamId: 1,
          playersById: input.playersById,
        }),
      )
      .filter((slot): slot is PlayerSetupSlot => slot != null);

    if (homeSlots.length === homeIds.length && awaySlots.length === awayIds.length) {
      return [...homeSlots, ...awaySlots];
    }
  }

  return [
    sideSlot({
      id: input.match.homeId,
      label: input.match.homeLabel,
      kind: input.match.homeKind,
      teamId: 0,
      playersById: input.playersById,
      teamsById: input.teamsById,
    }),
    sideSlot({
      id: input.match.awayId,
      label: input.match.awayLabel,
      kind: input.match.awayKind,
      teamId: 1,
      playersById: input.playersById,
      teamsById: input.teamsById,
    }),
  ];
}

export function getLeagueMatchRulesSummary(
  league: Pick<LeagueRow, "game_format" | "format" | "rules">,
): Array<{ label: string; value: string }> | null {
  if (!leagueHasSavedRules(league)) {
    return null;
  }

  const rules = resolveLeagueRulesForMatches(league);
  if (!rules) {
    return null;
  }

  return formatLeagueRulesSummaryRows(
    rules,
    formatLeagueGameFormatLabel(league.game_format),
    league.format,
  );
}

/**
 * Build an X01/Cricket setup from league Game Rules for a scheduled match.
 * Returns an error string when rules are missing or unsupported for play.
 */
export function buildLeagueMatchPlaySetup(input: {
  league: Pick<LeagueRow, "game_format" | "rules" | "format">;
  match: DraftLeagueMatch;
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  /** Director lineup from Match Control (overrides team-as-side placeholders). */
  homePlayerIds?: string[];
  awayPlayerIds?: string[];
}): { setup: LeaguePlayableSetup } | { error: string } {
  if (!leagueHasSavedRules(input.league)) {
    return {
      error:
        "Define and save Game Rules for this league before starting match play.",
    };
  }

  const rules = resolveLeagueRulesForMatches(input.league);
  if (!rules) {
    return { error: "Game Rules are incomplete for this league." };
  }

  const players = buildPlayersForMatch(input);
  if (players.length < 2) {
    return { error: "Both match sides are required to start scoring." };
  }

  const sidesAreTeams =
    input.match.homeKind === "team" || input.match.awayKind === "team";
  /** Team sides (with or without director lineup) keep team scoring mode. */
  const teamsEnabled = sidesAreTeams;
  const teamNames: MatchTeamNames = sidesAreTeams
    ? [input.match.homeLabel, input.match.awayLabel]
    : [players[0]!.name, players[1]!.name];

  if (rules.family === "x01") {
    return buildX01PlaySetup(rules, players, {
      teamsEnabled,
      teamNames,
    });
  }

  if (rules.family === "cricket") {
    return buildCricketPlaySetup(rules, players, {
      teamsEnabled,
      teamNames,
    });
  }

  if (rules.family === "tactics") {
    // Tactics uses the cricket tactics variant engine.
    const starter = mapStartingPlayer({
      startingPlayer: rules.startingPlayer,
    });
    if (!rules.matchFormat) {
      return { error: "Select a match format in Game Rules." };
    }

    const setup: CricketMatchSetup = {
      variant: "tactics",
      legsToWin: legsToWinFromBestOfGames(rules.matchFormat),
      setsToWin: 1,
      teamsEnabled,
      teamNames,
      startingPlayerRule: starter.startingPlayerRule,
      coinTossStarterIndex: starter.coinTossStarterIndex,
      players,
    };

    return { setup: { kind: "cricket", setup, playHref: "/cricket/play" } };
  }

  const format = normalizeLeagueGameFormat(input.league.game_format);
  return {
    error: `Match play is not available yet for ${formatLeagueGameFormatLabel(format) ?? "this"} game format.`,
  };
}

function buildX01PlaySetup(
  rules: X01LeagueRules,
  players: PlayerSetupSlot[],
  options: { teamsEnabled: boolean; teamNames?: MatchTeamNames },
): { setup: LeaguePlayableSetup } | { error: string } {
  if (
    rules.startingScore == null ||
    !rules.startingRule ||
    !rules.finishingRule ||
    !rules.matchFormat ||
    !rules.startingPlayer
  ) {
    return { error: "Complete all X01 Game Rules before starting match play." };
  }

  const gameType = resolveX01GameType(rules);
  if (!gameType) {
    return {
      error: "Starting score must be 201, 301, 501, or 701 for match play.",
    };
  }

  const starter = mapStartingPlayer({
    startingPlayer: rules.startingPlayer,
  });

  const setup: X01MatchSetup = {
    gameType,
    legsToWin: legsToWinFromX01MatchFormat(rules.matchFormat),
    setsToWin: 1,
    teamsEnabled: options.teamsEnabled,
    teamNames: options.teamNames ?? [players[0]!.name, players[1]!.name],
    startingPlayerRule: starter.startingPlayerRule,
    coinTossStarterIndex: starter.coinTossStarterIndex,
    inRule: mapX01InRule(rules.startingRule),
    outRule: mapX01OutRule(rules.finishingRule),
    players,
  };

  return {
    setup: {
      kind: "x01",
      setup,
      playHref: `/x01/${gameType}/play`,
    },
  };
}

function buildCricketPlaySetup(
  rules: CricketLeagueRules,
  players: PlayerSetupSlot[],
  options: { teamsEnabled: boolean; teamNames?: MatchTeamNames },
): { setup: LeaguePlayableSetup } | { error: string } {
  if (
    !rules.cricketVariant ||
    !rules.matchFormat ||
    !rules.startingPlayer
  ) {
    return {
      error: "Complete all Cricket Game Rules before starting match play.",
    };
  }

  const { variant, cutThroat } = mapCricketVariant(rules);
  const starter = mapStartingPlayer({
    startingPlayer: rules.startingPlayer,
  });

  const setup: CricketMatchSetup = {
    variant,
    cutThroat,
    legsToWin: legsToWinFromBestOfGames(rules.matchFormat),
    setsToWin: 1,
    teamsEnabled: options.teamsEnabled,
    teamNames: options.teamNames ?? [players[0]!.name, players[1]!.name],
    startingPlayerRule: starter.startingPlayerRule,
    coinTossStarterIndex: starter.coinTossStarterIndex,
    players,
  };

  return { setup: { kind: "cricket", setup, playHref: "/cricket/play" } };
}

export type { LeagueGameRules };
