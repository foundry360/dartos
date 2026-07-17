import { normalizeLeagueGameFormat } from "@/features/leagues/lib/league-formats";

/** Which rule schema a game format uses. */
export type LeagueRulesFamily =
  | "x01"
  | "cricket"
  | "tactics"
  | "mixed"
  | "custom";

export type X01StartingRule = "straight_in" | "double_in" | "master_in";
export type X01FinishingRule = "straight_out" | "double_out" | "master_out";
export type BustRule = "enabled" | "disabled";
export type X01MatchFormat =
  | "best_of_3"
  | "best_of_5"
  | "best_of_7"
  | "first_to_3"
  | "first_to_5";
export type X01StartingPlayer =
  | "coin_toss"
  | "home"
  | "away"
  | "alternate_legs";

/** Singles: matchups each player plays on a league night (1 = full round + bye). */
export const SINGLES_MATCHES_PER_PLAYER_MIN = 1;
export const SINGLES_MATCHES_PER_PLAYER_MAX = 12;

/**
 * Night structure fields live on every rules family.
 * Which fields apply depends on league format (singles vs team).
 */
export interface LeagueNightStructureFields {
  /** Singles: how many matchups each player plays per night (1–12). */
  matchesPerPlayer: number | null;
  teamSize: number | null;
  singlesCount: number | null;
  doublesCount: number | null;
}

export type CricketVariant = "standard" | "cut_throat";
export type CricketScoringMode = "traditional" | "no_score";
export type CricketOverkill =
  | "disabled"
  | "100"
  | "150"
  | "200"
  | "250";
export type CricketMatchFormat = "best_of_3" | "best_of_5" | "best_of_7";
export type CricketStartingPlayer =
  | "coin_toss"
  | "home"
  | "away"
  | "alternate_games";

export type TacticsMatchFormat = "best_of_3" | "best_of_5" | "best_of_7";
export type TacticsStartingPlayer = "coin_toss" | "home" | "away";

export type MixedRotationType = "random" | "scheduled" | "manual";
export type MixedRotationGame = "501" | "301" | "701" | "cricket" | "tactics";
/** When the rotation advances to the next game. */
export type MixedAdvanceEvery = "night" | "match";
/** After the last game in a scheduled sequence. */
export type MixedRepeatMode = "loop" | "once";
/** Who chooses the game when rotation is manual. */
export type MixedManualChooser = "director" | "home";

export interface MixedX01PlayDefaults {
  startingRule: X01StartingRule | null;
  finishingRule: X01FinishingRule | null;
  bustRule: BustRule | null;
  matchFormat: X01MatchFormat | null;
  startingPlayer: X01StartingPlayer | null;
}

export interface MixedCricketPlayDefaults {
  cricketVariant: CricketVariant | null;
  scoringMode: CricketScoringMode | null;
  overkillRule: CricketOverkill | null;
  matchFormat: CricketMatchFormat | null;
  startingPlayer: CricketStartingPlayer | null;
}

export interface MixedTacticsPlayDefaults {
  matchFormat: TacticsMatchFormat | null;
  startingPlayer: TacticsStartingPlayer | null;
}

export interface X01LeagueRules extends LeagueNightStructureFields {
  family: "x01";
  startingScore: number | null;
  startingRule: X01StartingRule | null;
  finishingRule: X01FinishingRule | null;
  bustRule: BustRule | null;
  matchFormat: X01MatchFormat | null;
  startingPlayer: X01StartingPlayer | null;
}

export interface CricketLeagueRules extends LeagueNightStructureFields {
  family: "cricket";
  cricketVariant: CricketVariant | null;
  scoringMode: CricketScoringMode | null;
  overkillRule: CricketOverkill | null;
  matchFormat: CricketMatchFormat | null;
  startingPlayer: CricketStartingPlayer | null;
}

export interface TacticsLeagueRules extends LeagueNightStructureFields {
  family: "tactics";
  scoringMode: "traditional";
  matchFormat: TacticsMatchFormat | null;
  startingPlayer: TacticsStartingPlayer | null;
}

export interface MixedLeagueRules extends LeagueNightStructureFields {
  family: "mixed";
  rotationType: MixedRotationType | null;
  /** Ordered sequence — order matters for scheduled rotation. */
  games: MixedRotationGame[];
  advanceEvery: MixedAdvanceEvery | null;
  repeatMode: MixedRepeatMode | null;
  manualChooser: MixedManualChooser | null;
  /** Shared X01 play settings; starting score comes from 501/301/701. */
  x01Defaults: MixedX01PlayDefaults;
  cricketDefaults: MixedCricketPlayDefaults;
  tacticsDefaults: MixedTacticsPlayDefaults;
}

export interface CustomLeagueRules extends LeagueNightStructureFields {
  family: "custom";
  customRulesText: string;
}

export type LeagueGameRules =
  | X01LeagueRules
  | CricketLeagueRules
  | TacticsLeagueRules
  | MixedLeagueRules
  | CustomLeagueRules;

export type LeagueRuleFieldKey = string;

export type LeagueRuleField =
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "number";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "select";
      options: Array<{ value: string; label: string }>;
    }
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "multiselect";
      options: Array<{ value: string; label: string }>;
    }
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "ordered-multiselect";
      options: Array<{ value: string; label: string }>;
      orderLabel?: string;
    }
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "textarea";
      rows?: number;
      placeholder?: string;
    }
  | {
      key: LeagueRuleFieldKey;
      label: string;
      type: "readonly";
      displayValue: string;
    };

export interface LeagueRuleFieldGroup {
  id: string;
  title: string;
  description?: string;
  fields: LeagueRuleField[];
}

const X01_STARTING_RULE_OPTIONS = [
  { value: "straight_in", label: "Straight In" },
  { value: "double_in", label: "Double In" },
  { value: "master_in", label: "Master In" },
] as const;

const X01_FINISHING_RULE_OPTIONS = [
  { value: "straight_out", label: "Straight Out" },
  { value: "double_out", label: "Double Out" },
  { value: "master_out", label: "Master Out" },
] as const;

const BUST_RULE_OPTIONS = [
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
] as const;

const X01_MATCH_FORMAT_OPTIONS = [
  { value: "best_of_3", label: "Best of 3 Legs" },
  { value: "best_of_5", label: "Best of 5 Legs" },
  { value: "best_of_7", label: "Best of 7 Legs" },
  { value: "first_to_3", label: "First to 3 Legs" },
  { value: "first_to_5", label: "First to 5 Legs" },
] as const;

const X01_STARTING_PLAYER_OPTIONS = [
  { value: "coin_toss", label: "Coin Toss" },
  { value: "home", label: "Home Team Starts" },
  { value: "away", label: "Away Team Starts" },
  { value: "alternate_legs", label: "Alternate Each Leg" },
] as const;

const CRICKET_VARIANT_OPTIONS = [
  { value: "standard", label: "Standard Cricket" },
  { value: "cut_throat", label: "Cut Throat Cricket" },
] as const;

const CRICKET_SCORING_MODE_OPTIONS = [
  { value: "traditional", label: "Traditional" },
  { value: "no_score", label: "No Score" },
] as const;

const CRICKET_OVERKILL_OPTIONS = [
  { value: "disabled", label: "Disabled" },
  { value: "100", label: "100 Points" },
  { value: "150", label: "150 Points" },
  { value: "200", label: "200 Points" },
  { value: "250", label: "250 Points" },
] as const;

const CRICKET_MATCH_FORMAT_OPTIONS = [
  { value: "best_of_3", label: "Best of 3 Games" },
  { value: "best_of_5", label: "Best of 5 Games" },
  { value: "best_of_7", label: "Best of 7 Games" },
] as const;

const TEAM_SIZE_OPTIONS = [
  { value: "2", label: "2 players" },
  { value: "3", label: "3 players" },
  { value: "4", label: "4 players" },
  { value: "5", label: "5 players" },
  { value: "6", label: "6 players" },
] as const;

const TEAM_LINEUP_COUNT_OPTIONS = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
] as const;

const CRICKET_STARTING_PLAYER_OPTIONS = [
  { value: "coin_toss", label: "Coin Toss" },
  { value: "home", label: "Home Team Starts" },
  { value: "away", label: "Away Team Starts" },
  { value: "alternate_games", label: "Alternate Games" },
] as const;

const TACTICS_MATCH_FORMAT_OPTIONS = [
  { value: "best_of_3", label: "Best of 3 Games" },
  { value: "best_of_5", label: "Best of 5 Games" },
  { value: "best_of_7", label: "Best of 7 Games" },
] as const;

const TACTICS_STARTING_PLAYER_OPTIONS = [
  { value: "coin_toss", label: "Coin Toss" },
  { value: "home", label: "Home Team" },
  { value: "away", label: "Away Team" },
] as const;

const MIXED_ROTATION_OPTIONS = [
  { value: "random", label: "Random" },
  { value: "scheduled", label: "Scheduled Rotation" },
  { value: "manual", label: "Manual" },
] as const;

const MIXED_ADVANCE_EVERY_OPTIONS = [
  { value: "night", label: "Each Night" },
  { value: "match", label: "Each Match" },
] as const;

const MIXED_REPEAT_MODE_OPTIONS = [
  { value: "loop", label: "Loop Sequence" },
  { value: "once", label: "Play Through Once" },
] as const;

const MIXED_MANUAL_CHOOSER_OPTIONS = [
  { value: "director", label: "League Director" },
  { value: "home", label: "Home Side" },
] as const;

const MIXED_GAME_OPTIONS = [
  { value: "501", label: "501" },
  { value: "301", label: "301" },
  { value: "701", label: "701" },
  { value: "cricket", label: "Cricket" },
  { value: "tactics", label: "Tactics" },
] as const;

const MIXED_X01_GAMES = new Set<MixedRotationGame>(["501", "301", "701"]);

export function mixedIncludesX01(games: MixedRotationGame[]): boolean {
  return games.some((game) => MIXED_X01_GAMES.has(game));
}

export function mixedIncludesCricket(games: MixedRotationGame[]): boolean {
  return games.includes("cricket");
}

export function mixedIncludesTactics(games: MixedRotationGame[]): boolean {
  return games.includes("tactics");
}

function emptyMixedX01Defaults(): MixedX01PlayDefaults {
  return {
    startingRule: null,
    finishingRule: null,
    bustRule: null,
    matchFormat: null,
    startingPlayer: null,
  };
}

function emptyMixedCricketDefaults(): MixedCricketPlayDefaults {
  return {
    cricketVariant: null,
    scoringMode: null,
    overkillRule: null,
    matchFormat: null,
    startingPlayer: null,
  };
}

function emptyMixedTacticsDefaults(): MixedTacticsPlayDefaults {
  return {
    matchFormat: null,
    startingPlayer: null,
  };
}

const LABEL_LOOKUP: Record<string, string> = Object.fromEntries(
  [
    ...X01_STARTING_RULE_OPTIONS,
    ...X01_FINISHING_RULE_OPTIONS,
    ...BUST_RULE_OPTIONS,
    ...X01_MATCH_FORMAT_OPTIONS,
    ...X01_STARTING_PLAYER_OPTIONS,
    ...CRICKET_VARIANT_OPTIONS,
    ...CRICKET_SCORING_MODE_OPTIONS,
    ...CRICKET_OVERKILL_OPTIONS,
    ...CRICKET_MATCH_FORMAT_OPTIONS,
    ...CRICKET_STARTING_PLAYER_OPTIONS,
    ...TACTICS_MATCH_FORMAT_OPTIONS,
    ...TACTICS_STARTING_PLAYER_OPTIONS,
    ...MIXED_ROTATION_OPTIONS,
    ...MIXED_ADVANCE_EVERY_OPTIONS,
    ...MIXED_REPEAT_MODE_OPTIONS,
    ...MIXED_MANUAL_CHOOSER_OPTIONS,
    ...MIXED_GAME_OPTIONS,
    ...TEAM_SIZE_OPTIONS,
  ].map((option) => [option.value, option.label]),
);

export function isSinglesLeagueFormat(
  leagueFormat: string | null | undefined,
): boolean {
  return (leagueFormat || "").toLowerCase() === "singles";
}

export function isTeamStyleLeagueFormat(
  leagueFormat: string | null | undefined,
): boolean {
  const format = (leagueFormat || "").toLowerCase();
  return (
    format === "team" ||
    format === "doubles" ||
    format === "blind_draw" ||
    format === "ladder"
  );
}

/**
 * Schedule night size derived from Game Rules → Match Format.
 * Singles: N matches/player = N full round-robin rounds that night
 * (each player plays N games; odd rosters get one bye per round).
 * Teams: team vs team pairing stays auto; lineup is stored on rules.
 */
export function resolveScheduleMatchesPerNightFromGameRules(input: {
  leagueFormat: string | null | undefined;
  rules: LeagueNightStructureFields | null | undefined;
  participantCount: number;
}): number | null {
  if (!isSinglesLeagueFormat(input.leagueFormat)) {
    return null;
  }

  const matchesPerPlayer = input.rules?.matchesPerPlayer ?? 1;
  if (matchesPerPlayer <= 1 || input.participantCount < 2) {
    return null;
  }

  const matchesPerRound = Math.max(1, Math.floor(input.participantCount / 2));
  return matchesPerPlayer * matchesPerRound;
}

/** How many full RR rounds to pack into one singles night. */
export function resolveSinglesRoundsPerNight(
  rules: LeagueNightStructureFields | null | undefined,
): number {
  return Math.max(1, rules?.matchesPerPlayer ?? 1);
}

export function didLeagueNightFormatChange(
  beforeRules: unknown,
  afterRules: unknown,
  gameFormat: string | null | undefined,
): boolean {
  const before = normalizeLeagueRules(beforeRules, gameFormat);
  const after = normalizeLeagueRules(afterRules, gameFormat);

  if (!before || !after) {
    return before != null || after != null;
  }

  return (
    before.matchesPerPlayer !== after.matchesPerPlayer ||
    before.teamSize !== after.teamSize ||
    before.singlesCount !== after.singlesCount ||
    before.doublesCount !== after.doublesCount
  );
}

export function formatNightStructureSummary(
  rules: LeagueNightStructureFields,
  leagueFormat: string | null | undefined,
): Array<{ label: string; value: string }> {
  if (isSinglesLeagueFormat(leagueFormat)) {
    return [
      {
        label: "Matches Per Player",
        value:
          rules.matchesPerPlayer != null
            ? rules.matchesPerPlayer === 1
              ? "1 (full round + bye)"
              : `${rules.matchesPerPlayer} per night`
            : "—",
      },
    ];
  }

  if (isTeamStyleLeagueFormat(leagueFormat)) {
    return [
      {
        label: "Team Size",
        value:
          rules.teamSize != null ? labelFor(String(rules.teamSize)) : "—",
      },
      {
        label: "Night Lineup",
        value:
          rules.singlesCount != null && rules.doublesCount != null
            ? `${rules.singlesCount} singles + ${rules.doublesCount} doubles`
            : "—",
      },
    ];
  }

  return [];
}

function labelFor(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  return LABEL_LOOKUP[value] ?? value;
}

export function getRulesFamilyForGameFormat(
  gameFormat: string | null | undefined,
): LeagueRulesFamily | null {
  const normalized = normalizeLeagueGameFormat(gameFormat);

  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "x01":
      return "x01";
    case "cricket":
      return "cricket";
    case "tactics":
      return "tactics";
    case "mixed":
      return "mixed";
    case "custom":
      return "custom";
    default:
      return null;
  }
}

/** Starting score implied by legacy game_format values (501/301/701). */
function legacyX01StartingScore(
  gameFormat: string | null | undefined,
): number | null {
  const raw = gameFormat?.trim().toLowerCase();
  if (raw === "501" || raw === "301" || raw === "701") {
    return Number(raw);
  }
  return null;
}

function emptyNightStructure(): LeagueNightStructureFields {
  return {
    matchesPerPlayer: null,
    teamSize: null,
    singlesCount: null,
    doublesCount: null,
  };
}

function normalizeNightStructure(
  raw: Record<string, unknown>,
): LeagueNightStructureFields {
  const matchesPerPlayer = pickNumberOrNull(raw.matchesPerPlayer);
  const teamSize = pickNumberOrNull(raw.teamSize);
  const singlesCount = pickNumberOrNull(raw.singlesCount);
  const doublesCount = pickNumberOrNull(raw.doublesCount);

  return {
    matchesPerPlayer:
      matchesPerPlayer != null &&
      matchesPerPlayer >= SINGLES_MATCHES_PER_PLAYER_MIN &&
      matchesPerPlayer <= SINGLES_MATCHES_PER_PLAYER_MAX
        ? matchesPerPlayer
        : null,
    teamSize:
      teamSize != null && teamSize >= 2 && teamSize <= 8 ? teamSize : null,
    singlesCount:
      singlesCount != null && singlesCount >= 0 && singlesCount <= 8
        ? singlesCount
        : null,
    doublesCount:
      doublesCount != null && doublesCount >= 0 && doublesCount <= 8
        ? doublesCount
        : null,
  };
}

function nightStructureForLeagueFormat(
  leagueFormat: string | null | undefined,
): LeagueNightStructureFields {
  if (isSinglesLeagueFormat(leagueFormat)) {
    return {
      matchesPerPlayer: 1,
      teamSize: null,
      singlesCount: null,
      doublesCount: null,
    };
  }

  if (isTeamStyleLeagueFormat(leagueFormat)) {
    return {
      matchesPerPlayer: null,
      teamSize: 4,
      singlesCount: 2,
      doublesCount: 1,
    };
  }

  return emptyNightStructure();
}

/** Empty rules shell for a game format — no preset selections. */
export function getDefaultLeagueRules(
  gameFormat: string | null | undefined,
): LeagueGameRules | null {
  const normalized = normalizeLeagueGameFormat(gameFormat);
  const family = getRulesFamilyForGameFormat(normalized);

  if (!normalized || !family) {
    return null;
  }

  const night = emptyNightStructure();

  switch (family) {
    case "x01":
      return {
        family: "x01",
        startingScore: legacyX01StartingScore(gameFormat),
        startingRule: null,
        finishingRule: null,
        bustRule: null,
        matchFormat: null,
        startingPlayer: null,
        ...night,
      };
    case "cricket":
      return {
        family: "cricket",
        cricketVariant: null,
        scoringMode: null,
        overkillRule: null,
        matchFormat: null,
        startingPlayer: null,
        ...night,
      };
    case "tactics":
      return {
        family: "tactics",
        scoringMode: "traditional",
        matchFormat: null,
        startingPlayer: null,
        ...night,
      };
    case "mixed":
      return {
        family: "mixed",
        rotationType: null,
        games: [],
        advanceEvery: null,
        repeatMode: null,
        manualChooser: null,
        x01Defaults: emptyMixedX01Defaults(),
        cricketDefaults: emptyMixedCricketDefaults(),
        tacticsDefaults: emptyMixedTacticsDefaults(),
        ...night,
      };
    case "custom":
      return {
        family: "custom",
        customRulesText: "",
        ...night,
      };
  }
}

/**
 * Sensible complete defaults for a new league so Schedule / Match Format
 * have night structure and play rules without a separate Game Rules save.
 */
export function getStarterLeagueRules(
  gameFormat: string | null | undefined,
  leagueFormat: string | null | undefined,
): LeagueGameRules | null {
  const normalized = normalizeLeagueGameFormat(gameFormat);
  const family = getRulesFamilyForGameFormat(normalized);

  if (!normalized || !family) {
    return null;
  }

  const night = nightStructureForLeagueFormat(leagueFormat);

  switch (family) {
    case "x01":
      return {
        family: "x01",
        startingScore: legacyX01StartingScore(gameFormat) ?? 501,
        startingRule: "straight_in",
        finishingRule: "double_out",
        bustRule: "enabled",
        matchFormat: "best_of_3",
        startingPlayer: "coin_toss",
        ...night,
      };
    case "cricket":
      return {
        family: "cricket",
        cricketVariant: "standard",
        scoringMode: "traditional",
        overkillRule: "disabled",
        matchFormat: "best_of_3",
        startingPlayer: "coin_toss",
        ...night,
      };
    case "tactics":
      return {
        family: "tactics",
        scoringMode: "traditional",
        matchFormat: "best_of_3",
        startingPlayer: "coin_toss",
        ...night,
      };
    case "mixed":
      return {
        family: "mixed",
        rotationType: "scheduled",
        games: ["501", "cricket"],
        advanceEvery: "night",
        repeatMode: "loop",
        manualChooser: null,
        x01Defaults: {
          startingRule: "straight_in",
          finishingRule: "double_out",
          bustRule: "enabled",
          matchFormat: "best_of_3",
          startingPlayer: "coin_toss",
        },
        cricketDefaults: {
          cricketVariant: "standard",
          scoringMode: "traditional",
          overkillRule: "disabled",
          matchFormat: "best_of_3",
          startingPlayer: "coin_toss",
        },
        tacticsDefaults: {
          matchFormat: "best_of_3",
          startingPlayer: "coin_toss",
        },
        ...night,
      };
    case "custom":
      return {
        family: "custom",
        customRulesText:
          "Directors: replace this with your house rules for match play.",
        ...night,
      };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickOptionOrNull<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" &&
    value !== "" &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function pickNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed);
    }
  }

  return null;
}

/**
 * Normalize stored JSON (or partial form state) into a typed rules object
 * for the league's current game format. Unset fields stay empty ("-").
 */
export function normalizeLeagueRules(
  raw: unknown,
  gameFormat: string | null | undefined,
): LeagueGameRules | null {
  const empty = getDefaultLeagueRules(gameFormat);

  if (!empty) {
    return null;
  }

  if (!isRecord(raw) || raw.family !== empty.family) {
    return empty;
  }

  switch (empty.family) {
    case "x01": {
      const parsedScore = pickNumberOrNull(raw.startingScore);
      const startingScore =
        parsedScore != null
          ? parsedScore >= 101 && parsedScore <= 1001
            ? parsedScore
            : null
          : legacyX01StartingScore(gameFormat);
      return {
        family: "x01",
        startingScore,
        startingRule: pickOptionOrNull(
          raw.startingRule,
          ["straight_in", "double_in", "master_in"] as const,
        ),
        finishingRule: pickOptionOrNull(
          raw.finishingRule,
          ["straight_out", "double_out", "master_out"] as const,
        ),
        bustRule: pickOptionOrNull(
          raw.bustRule,
          ["enabled", "disabled"] as const,
        ),
        matchFormat: pickOptionOrNull(
          raw.matchFormat,
          [
            "best_of_3",
            "best_of_5",
            "best_of_7",
            "first_to_3",
            "first_to_5",
          ] as const,
        ),
        startingPlayer: pickOptionOrNull(
          raw.startingPlayer,
          ["coin_toss", "home", "away", "alternate_legs"] as const,
        ),
        ...normalizeNightStructure(raw),
      };
    }
    case "cricket":
      return {
        family: "cricket",
        cricketVariant: pickOptionOrNull(
          raw.cricketVariant,
          ["standard", "cut_throat"] as const,
        ),
        scoringMode: pickOptionOrNull(
          raw.scoringMode,
          ["traditional", "no_score"] as const,
        ),
        overkillRule: pickOptionOrNull(
          raw.overkillRule,
          ["disabled", "100", "150", "200", "250"] as const,
        ),
        matchFormat: pickOptionOrNull(
          raw.matchFormat,
          ["best_of_3", "best_of_5", "best_of_7"] as const,
        ),
        startingPlayer: pickOptionOrNull(
          raw.startingPlayer,
          ["coin_toss", "home", "away", "alternate_games"] as const,
        ),
        ...normalizeNightStructure(raw),
      };
    case "tactics":
      return {
        family: "tactics",
        scoringMode: "traditional",
        matchFormat: pickOptionOrNull(
          raw.matchFormat,
          ["best_of_3", "best_of_5", "best_of_7"] as const,
        ),
        startingPlayer: pickOptionOrNull(
          raw.startingPlayer,
          ["coin_toss", "home", "away"] as const,
        ),
        ...normalizeNightStructure(raw),
      };
    case "mixed": {
      const gamesRaw = Array.isArray(raw.games) ? raw.games : [];
      const games = gamesRaw.filter(
        (entry): entry is MixedRotationGame =>
          typeof entry === "string" &&
          (MIXED_GAME_OPTIONS as readonly { value: string }[]).some(
            (option) => option.value === entry,
          ),
      );
      const x01Raw = isRecord(raw.x01Defaults) ? raw.x01Defaults : {};
      const cricketRaw = isRecord(raw.cricketDefaults)
        ? raw.cricketDefaults
        : {};
      const tacticsRaw = isRecord(raw.tacticsDefaults)
        ? raw.tacticsDefaults
        : {};

      return {
        family: "mixed",
        rotationType: pickOptionOrNull(
          raw.rotationType,
          ["random", "scheduled", "manual"] as const,
        ),
        games,
        advanceEvery: pickOptionOrNull(
          raw.advanceEvery,
          ["night", "match"] as const,
        ),
        repeatMode: pickOptionOrNull(
          raw.repeatMode,
          ["loop", "once"] as const,
        ),
        manualChooser: pickOptionOrNull(
          raw.manualChooser,
          ["director", "home"] as const,
        ),
        x01Defaults: {
          startingRule: pickOptionOrNull(
            x01Raw.startingRule,
            ["straight_in", "double_in", "master_in"] as const,
          ),
          finishingRule: pickOptionOrNull(
            x01Raw.finishingRule,
            ["straight_out", "double_out", "master_out"] as const,
          ),
          bustRule: pickOptionOrNull(
            x01Raw.bustRule,
            ["enabled", "disabled"] as const,
          ),
          matchFormat: pickOptionOrNull(
            x01Raw.matchFormat,
            [
              "best_of_3",
              "best_of_5",
              "best_of_7",
              "first_to_3",
              "first_to_5",
            ] as const,
          ),
          startingPlayer: pickOptionOrNull(
            x01Raw.startingPlayer,
            ["coin_toss", "home", "away", "alternate_legs"] as const,
          ),
        },
        cricketDefaults: {
          cricketVariant: pickOptionOrNull(
            cricketRaw.cricketVariant,
            ["standard", "cut_throat"] as const,
          ),
          scoringMode: pickOptionOrNull(
            cricketRaw.scoringMode,
            ["traditional", "no_score"] as const,
          ),
          overkillRule: pickOptionOrNull(
            cricketRaw.overkillRule,
            ["disabled", "100", "150", "200", "250"] as const,
          ),
          matchFormat: pickOptionOrNull(
            cricketRaw.matchFormat,
            ["best_of_3", "best_of_5", "best_of_7"] as const,
          ),
          startingPlayer: pickOptionOrNull(
            cricketRaw.startingPlayer,
            ["coin_toss", "home", "away", "alternate_games"] as const,
          ),
        },
        tacticsDefaults: {
          matchFormat: pickOptionOrNull(
            tacticsRaw.matchFormat,
            ["best_of_3", "best_of_5", "best_of_7"] as const,
          ),
          startingPlayer: pickOptionOrNull(
            tacticsRaw.startingPlayer,
            ["coin_toss", "home", "away"] as const,
          ),
        },
        ...normalizeNightStructure(raw),
      };
    }
    case "custom":
      return {
        family: "custom",
        customRulesText:
          typeof raw.customRulesText === "string"
            ? raw.customRulesText
            : "",
        ...normalizeNightStructure(raw),
      };
  }
}

/** Effective rules every scheduled match should inherit. */
export function resolveLeagueRulesForMatches(league: {
  game_format?: string | null;
  rules?: unknown;
}): LeagueGameRules | null {
  return normalizeLeagueRules(league.rules, league.game_format);
}

/** Saved rules when valid; otherwise starter defaults for schedule UI. */
export function resolveLeagueRulesForMatchesOrStarter(league: {
  game_format?: string | null;
  format?: string | null;
  rules?: unknown;
}): LeagueGameRules | null {
  const saved = resolveLeagueRulesForMatches(league);

  if (
    saved &&
    validateLeagueRules(saved, league.format) == null
  ) {
    return saved;
  }

  return (
    getStarterLeagueRules(league.game_format, league.format) ?? saved
  );
}

export function leagueHasSavedRules(league: {
  game_format?: string | null;
  format?: string | null;
  rules?: unknown;
}): boolean {
  if (!league.game_format || league.rules == null) {
    return false;
  }

  if (!isRecord(league.rules)) {
    return false;
  }

  const family = getRulesFamilyForGameFormat(league.game_format);
  if (family == null || league.rules.family !== family) {
    return false;
  }

  const normalized = normalizeLeagueRules(league.rules, league.game_format);
  return (
    normalized != null &&
    validateLeagueRules(normalized, league.format) == null
  );
}

function nightStructureFields(
  leagueFormat: string | null | undefined,
): LeagueRuleField[] {
  if (isSinglesLeagueFormat(leagueFormat)) {
    return [
      {
        key: "matchesPerPlayer",
        label: "Matches Per Player",
        type: "number",
        min: SINGLES_MATCHES_PER_PLAYER_MIN,
        max: SINGLES_MATCHES_PER_PLAYER_MAX,
        step: 1,
      },
    ];
  }

  if (isTeamStyleLeagueFormat(leagueFormat)) {
    return [
      {
        key: "teamSize",
        label: "Team Size",
        type: "select",
        options: [...TEAM_SIZE_OPTIONS],
      },
      {
        key: "singlesCount",
        label: "Singles Games",
        type: "select",
        options: [...TEAM_LINEUP_COUNT_OPTIONS],
      },
      {
        key: "doublesCount",
        label: "Doubles Games",
        type: "select",
        options: [...TEAM_LINEUP_COUNT_OPTIONS],
      },
    ];
  }

  return [];
}

function matchFormatDescription(
  leagueFormat: string | null | undefined,
  seriesDescription: string,
): string | undefined {
  const nightNote = isSinglesLeagueFormat(leagueFormat)
    ? "Matches Per Player sets how many matchups each player plays on a scheduled night."
    : isTeamStyleLeagueFormat(leagueFormat)
      ? "Set team size and the singles/doubles makeup of each team match night."
      : null;

  if (seriesDescription && nightNote) {
    return `${seriesDescription} ${nightNote}`;
  }
  return seriesDescription || nightNote || undefined;
}

function buildMatchFormatGroup(
  leagueFormat: string | null | undefined,
  fields: LeagueRuleField[],
  description?: string,
): LeagueRuleFieldGroup {
  return {
    id: "match",
    title: "Match Format",
    description,
    fields: [...nightStructureFields(leagueFormat), ...fields],
  };
}

export function getLeagueRuleFieldGroups(
  gameFormat: string | null | undefined,
  leagueFormat?: string | null,
  draft?: LeagueGameRules | null,
): LeagueRuleFieldGroup[] {
  const family = getRulesFamilyForGameFormat(gameFormat);
  const normalized = normalizeLeagueGameFormat(gameFormat);
  const nightFields = nightStructureFields(leagueFormat);

  if (!family || !normalized) {
    return nightFields.length > 0
      ? [
          {
            id: "match",
            title: "Match Format",
            fields: nightFields,
          },
        ]
      : [];
  }

  switch (family) {
    case "x01":
      return [
        {
          id: "scoring",
          title: "Scoring Rules",
          description: "Applied to every scheduled match in this league.",
          fields: [
            {
              key: "startingScore",
              label: "Starting Score",
              type: "number",
              min: 101,
              max: 1001,
              step: 100,
            },
            {
              key: "startingRule",
              label: "Starting Rule",
              type: "select",
              options: [...X01_STARTING_RULE_OPTIONS],
            },
            {
              key: "finishingRule",
              label: "Finishing Rule",
              type: "select",
              options: [...X01_FINISHING_RULE_OPTIONS],
            },
            {
              key: "bustRule",
              label: "Bust Rule",
              type: "select",
              options: [...BUST_RULE_OPTIONS],
            },
          ],
        },
        buildMatchFormatGroup(
          leagueFormat,
          [
            {
              key: "matchFormat",
              label: "Match Format",
              type: "select",
              options: [...X01_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...X01_STARTING_PLAYER_OPTIONS],
            },
          ],
          matchFormatDescription(
            leagueFormat,
            "How each scheduled matchup is won (legs/games inside one opponent pairing).",
          ),
        ),
      ];
    case "cricket":
      return [
        {
          id: "scoring",
          title: "Cricket Rules",
          description: "Applied to every scheduled match in this league.",
          fields: [
            {
              key: "cricketVariant",
              label: "Cricket Variant",
              type: "select",
              options: [...CRICKET_VARIANT_OPTIONS],
            },
            {
              key: "scoringMode",
              label: "Scoring Mode",
              type: "select",
              options: [...CRICKET_SCORING_MODE_OPTIONS],
            },
            {
              key: "overkillRule",
              label: "Overkill Rule",
              type: "select",
              options: [...CRICKET_OVERKILL_OPTIONS],
            },
          ],
        },
        buildMatchFormatGroup(
          leagueFormat,
          [
            {
              key: "matchFormat",
              label: "Match Format",
              type: "select",
              options: [...CRICKET_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...CRICKET_STARTING_PLAYER_OPTIONS],
            },
          ],
          matchFormatDescription(
            leagueFormat,
            "How each scheduled matchup is won (games count inside one opponent pairing).",
          ),
        ),
      ];
    case "tactics":
      return [
        {
          id: "scoring",
          title: "Tactics Rules",
          description: "Applied to every scheduled match in this league.",
          fields: [
            {
              key: "scoringMode",
              label: "Scoring Mode",
              type: "readonly",
              displayValue: "Traditional",
            },
          ],
        },
        buildMatchFormatGroup(
          leagueFormat,
          [
            {
              key: "matchFormat",
              label: "Match Format",
              type: "select",
              options: [...TACTICS_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...TACTICS_STARTING_PLAYER_OPTIONS],
            },
          ],
          matchFormatDescription(leagueFormat, ""),
        ),
      ];
    case "mixed": {
      const mixedDraft = draft?.family === "mixed" ? draft : null;
      const rotationType = mixedDraft?.rotationType ?? null;
      const selectedGames = mixedDraft?.games ?? [];
      const groups: LeagueRuleFieldGroup[] = [];

      if (nightFields.length > 0) {
        groups.push({
          id: "match",
          title: "Match Format",
          description: isSinglesLeagueFormat(leagueFormat)
            ? "How many matchups each player plays on a scheduled night."
            : "Team size and the singles/doubles makeup of each team match night.",
          fields: nightFields,
        });
      }

      const rotationFields: LeagueRuleField[] = [
        {
          key: "rotationType",
          label: "Rotation Type",
          type: "select",
          options: [...MIXED_ROTATION_OPTIONS],
        },
        {
          key: "games",
          label: "Games in Rotation",
          type: "ordered-multiselect",
          options: [...MIXED_GAME_OPTIONS],
          orderLabel: "Rotation order",
        },
      ];

      if (rotationType === "random" || rotationType === "scheduled") {
        rotationFields.push({
          key: "advanceEvery",
          label: "Advance Every",
          type: "select",
          options: [...MIXED_ADVANCE_EVERY_OPTIONS],
        });
      }

      if (rotationType === "scheduled") {
        rotationFields.push({
          key: "repeatMode",
          label: "After Last Game",
          type: "select",
          options: [...MIXED_REPEAT_MODE_OPTIONS],
        });
      }

      if (rotationType === "manual") {
        rotationFields.push({
          key: "manualChooser",
          label: "Who Chooses",
          type: "select",
          options: [...MIXED_MANUAL_CHOOSER_OPTIONS],
        });
      }

      groups.push({
        id: "rotation",
        title: "Mixed Games",
        description:
          "Choose how games rotate, their order, and which formats appear through the season.",
        fields: rotationFields,
      });

      if (mixedIncludesX01(selectedGames)) {
        groups.push({
          id: "mixed-x01",
          title: "X01 Defaults",
          description:
            "Applied when the night’s game is 501, 301, or 701. Starting score comes from the selected game.",
          fields: [
            {
              key: "x01Defaults.startingRule",
              label: "Starting Rule",
              type: "select",
              options: [...X01_STARTING_RULE_OPTIONS],
            },
            {
              key: "x01Defaults.finishingRule",
              label: "Finishing Rule",
              type: "select",
              options: [...X01_FINISHING_RULE_OPTIONS],
            },
            {
              key: "x01Defaults.bustRule",
              label: "Bust Rule",
              type: "select",
              options: [...BUST_RULE_OPTIONS],
            },
            {
              key: "x01Defaults.matchFormat",
              label: "Match Format",
              type: "select",
              options: [...X01_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "x01Defaults.startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...X01_STARTING_PLAYER_OPTIONS],
            },
          ],
        });
      }

      if (mixedIncludesCricket(selectedGames)) {
        groups.push({
          id: "mixed-cricket",
          title: "Cricket Defaults",
          description: "Applied when the night’s game is Cricket.",
          fields: [
            {
              key: "cricketDefaults.cricketVariant",
              label: "Cricket Variant",
              type: "select",
              options: [...CRICKET_VARIANT_OPTIONS],
            },
            {
              key: "cricketDefaults.scoringMode",
              label: "Scoring Mode",
              type: "select",
              options: [...CRICKET_SCORING_MODE_OPTIONS],
            },
            {
              key: "cricketDefaults.overkillRule",
              label: "Overkill Rule",
              type: "select",
              options: [...CRICKET_OVERKILL_OPTIONS],
            },
            {
              key: "cricketDefaults.matchFormat",
              label: "Match Format",
              type: "select",
              options: [...CRICKET_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "cricketDefaults.startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...CRICKET_STARTING_PLAYER_OPTIONS],
            },
          ],
        });
      }

      if (mixedIncludesTactics(selectedGames)) {
        groups.push({
          id: "mixed-tactics",
          title: "Tactics Defaults",
          description: "Applied when the night’s game is Tactics.",
          fields: [
            {
              key: "tacticsDefaults.matchFormat",
              label: "Match Format",
              type: "select",
              options: [...TACTICS_MATCH_FORMAT_OPTIONS],
            },
            {
              key: "tacticsDefaults.startingPlayer",
              label: "Starting Player",
              type: "select",
              options: [...TACTICS_STARTING_PLAYER_OPTIONS],
            },
          ],
        });
      }

      return groups;
    }
    case "custom": {
      const groups: LeagueRuleFieldGroup[] = [];
      if (nightFields.length > 0) {
        groups.push({
          id: "match",
          title: "Match Format",
          description: isSinglesLeagueFormat(leagueFormat)
            ? "How many matchups each player plays on a scheduled night."
            : "Team size and the singles/doubles makeup of each team match night.",
          fields: nightFields,
        });
      }
      groups.push({
        id: "custom",
        title: "Custom Rules",
        description:
          "Define league-specific match play rules for directors and players.",
        fields: [
          {
            key: "customRulesText",
            label: "Game Rules",
            type: "textarea",
            rows: 10,
            placeholder:
              "Describe scoring, match format, starting player, and any house rules…",
          },
        ],
      });
      return groups;
    }
  }
}

export function formatLeagueRulesSummaryRows(
  rules: LeagueGameRules,
  gameFormatLabel: string | null,
  leagueFormat?: string | null,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Game Format",
      value: gameFormatLabel ?? "Not set",
    },
    ...formatNightStructureSummary(rules, leagueFormat),
  ];

  switch (rules.family) {
    case "x01":
      rows.push(
        {
          label: "Starting Score",
          value:
            rules.startingScore != null ? String(rules.startingScore) : "—",
        },
        { label: "Starting Rule", value: labelFor(rules.startingRule) },
        { label: "Finishing Rule", value: labelFor(rules.finishingRule) },
        { label: "Bust Rule", value: labelFor(rules.bustRule) },
        { label: "Match Format", value: labelFor(rules.matchFormat) },
        { label: "Starting Player", value: labelFor(rules.startingPlayer) },
      );
      break;
    case "cricket":
      rows.push(
        { label: "Cricket Variant", value: labelFor(rules.cricketVariant) },
        { label: "Scoring Mode", value: labelFor(rules.scoringMode) },
        { label: "Overkill Rule", value: labelFor(rules.overkillRule) },
        { label: "Match Format", value: labelFor(rules.matchFormat) },
        { label: "Starting Player", value: labelFor(rules.startingPlayer) },
      );
      break;
    case "tactics":
      rows.push(
        { label: "Scoring Mode", value: "Traditional" },
        { label: "Match Format", value: labelFor(rules.matchFormat) },
        { label: "Starting Player", value: labelFor(rules.startingPlayer) },
      );
      break;
    case "mixed":
      rows.push(
        { label: "Rotation Type", value: labelFor(rules.rotationType) },
        {
          label: "Games (order)",
          value:
            rules.games.map((game, index) => `${index + 1}. ${labelFor(game)}`).join(" → ") ||
            "None selected",
        },
      );
      if (rules.rotationType === "random" || rules.rotationType === "scheduled") {
        rows.push({
          label: "Advance Every",
          value: labelFor(rules.advanceEvery),
        });
      }
      if (rules.rotationType === "scheduled") {
        rows.push({
          label: "After Last Game",
          value: labelFor(rules.repeatMode),
        });
      }
      if (rules.rotationType === "manual") {
        rows.push({
          label: "Who Chooses",
          value: labelFor(rules.manualChooser),
        });
      }
      if (mixedIncludesX01(rules.games)) {
        rows.push(
          {
            label: "X01 Starting Rule",
            value: labelFor(rules.x01Defaults.startingRule),
          },
          {
            label: "X01 Finishing Rule",
            value: labelFor(rules.x01Defaults.finishingRule),
          },
          {
            label: "X01 Match Format",
            value: labelFor(rules.x01Defaults.matchFormat),
          },
        );
      }
      if (mixedIncludesCricket(rules.games)) {
        rows.push(
          {
            label: "Cricket Variant",
            value: labelFor(rules.cricketDefaults.cricketVariant),
          },
          {
            label: "Cricket Match Format",
            value: labelFor(rules.cricketDefaults.matchFormat),
          },
        );
      }
      if (mixedIncludesTactics(rules.games)) {
        rows.push({
          label: "Tactics Match Format",
          value: labelFor(rules.tacticsDefaults.matchFormat),
        });
      }
      break;
    case "custom":
      rows.push({
        label: "Rules",
        value: rules.customRulesText.trim()
          ? rules.customRulesText.trim()
          : "Not set",
      });
      break;
  }

  return rows;
}

function validateNightStructure(
  rules: LeagueNightStructureFields,
  leagueFormat: string | null | undefined,
): string | null {
  if (isSinglesLeagueFormat(leagueFormat)) {
    if (rules.matchesPerPlayer == null) {
      return "Enter matches per player for league nights.";
    }
    if (
      rules.matchesPerPlayer < SINGLES_MATCHES_PER_PLAYER_MIN ||
      rules.matchesPerPlayer > SINGLES_MATCHES_PER_PLAYER_MAX
    ) {
      return `Matches per player must be between ${SINGLES_MATCHES_PER_PLAYER_MIN} and ${SINGLES_MATCHES_PER_PLAYER_MAX}.`;
    }
    return null;
  }

  if (isTeamStyleLeagueFormat(leagueFormat)) {
    if (rules.teamSize == null) {
      return "Select team size.";
    }
    if (rules.singlesCount == null) {
      return "Select number of singles games.";
    }
    if (rules.doublesCount == null) {
      return "Select number of doubles games.";
    }
    if (rules.singlesCount + rules.doublesCount < 1) {
      return "Set at least one singles or doubles game per team night.";
    }
    return null;
  }

  return null;
}

export function validateLeagueRules(
  rules: LeagueGameRules,
  leagueFormat?: string | null,
): string | null {
  const nightError = validateNightStructure(rules, leagueFormat);
  if (nightError) {
    return nightError;
  }

  switch (rules.family) {
    case "x01": {
      if (rules.startingScore == null) {
        return "Select a starting score.";
      }
      if (rules.startingScore < 101 || rules.startingScore > 1001) {
        return "Starting score must be between 101 and 1001.";
      }
      if (!rules.startingRule) {
        return "Select a starting rule.";
      }
      if (!rules.finishingRule) {
        return "Select a finishing rule.";
      }
      if (!rules.bustRule) {
        return "Select a bust rule.";
      }
      if (!rules.matchFormat) {
        return "Select a series format.";
      }
      if (!rules.startingPlayer) {
        return "Select a starting player.";
      }
      return null;
    }
    case "cricket": {
      if (!rules.cricketVariant) {
        return "Select a cricket variant.";
      }
      if (!rules.scoringMode) {
        return "Select a scoring mode.";
      }
      if (!rules.overkillRule) {
        return "Select an overkill rule.";
      }
      if (!rules.matchFormat) {
        return "Select a series format.";
      }
      if (!rules.startingPlayer) {
        return "Select a starting player.";
      }
      return null;
    }
    case "tactics": {
      if (!rules.matchFormat) {
        return "Select a series format.";
      }
      if (!rules.startingPlayer) {
        return "Select a starting player.";
      }
      return null;
    }
    case "mixed": {
      if (!rules.rotationType) {
        return "Select a rotation type.";
      }
      if (rules.games.length === 0) {
        return "Select at least one game for the mixed rotation.";
      }
      if (
        (rules.rotationType === "random" ||
          rules.rotationType === "scheduled") &&
        !rules.advanceEvery
      ) {
        return "Select when the rotation advances.";
      }
      if (rules.rotationType === "scheduled" && !rules.repeatMode) {
        return "Select what happens after the last game in the sequence.";
      }
      if (rules.rotationType === "manual" && !rules.manualChooser) {
        return "Select who chooses the game for manual rotation.";
      }
      if (mixedIncludesX01(rules.games)) {
        if (!rules.x01Defaults.startingRule) {
          return "Select an X01 starting rule.";
        }
        if (!rules.x01Defaults.finishingRule) {
          return "Select an X01 finishing rule.";
        }
        if (!rules.x01Defaults.bustRule) {
          return "Select an X01 bust rule.";
        }
        if (!rules.x01Defaults.matchFormat) {
          return "Select an X01 match format.";
        }
        if (!rules.x01Defaults.startingPlayer) {
          return "Select an X01 starting player.";
        }
      }
      if (mixedIncludesCricket(rules.games)) {
        if (!rules.cricketDefaults.cricketVariant) {
          return "Select a cricket variant.";
        }
        if (!rules.cricketDefaults.scoringMode) {
          return "Select a cricket scoring mode.";
        }
        if (!rules.cricketDefaults.overkillRule) {
          return "Select a cricket overkill rule.";
        }
        if (!rules.cricketDefaults.matchFormat) {
          return "Select a cricket match format.";
        }
        if (!rules.cricketDefaults.startingPlayer) {
          return "Select a cricket starting player.";
        }
      }
      if (mixedIncludesTactics(rules.games)) {
        if (!rules.tacticsDefaults.matchFormat) {
          return "Select a tactics match format.";
        }
        if (!rules.tacticsDefaults.startingPlayer) {
          return "Select a tactics starting player.";
        }
      }
      return null;
    }
    case "custom": {
      if (!rules.customRulesText.trim()) {
        return "Enter custom game rules before saving.";
      }
      return null;
    }
  }
}
