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

export interface X01LeagueRules {
  family: "x01";
  startingScore: number | null;
  startingRule: X01StartingRule | null;
  finishingRule: X01FinishingRule | null;
  bustRule: BustRule | null;
  matchFormat: X01MatchFormat | null;
  startingPlayer: X01StartingPlayer | null;
}

export interface CricketLeagueRules {
  family: "cricket";
  cricketVariant: CricketVariant | null;
  scoringMode: CricketScoringMode | null;
  overkillRule: CricketOverkill | null;
  matchFormat: CricketMatchFormat | null;
  startingPlayer: CricketStartingPlayer | null;
}

export interface TacticsLeagueRules {
  family: "tactics";
  scoringMode: "traditional";
  matchFormat: TacticsMatchFormat | null;
  startingPlayer: TacticsStartingPlayer | null;
}

export interface MixedLeagueRules {
  family: "mixed";
  rotationType: MixedRotationType | null;
  games: MixedRotationGame[];
}

export interface CustomLeagueRules {
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

const MIXED_GAME_OPTIONS = [
  { value: "501", label: "501" },
  { value: "301", label: "301" },
  { value: "701", label: "701" },
  { value: "cricket", label: "Cricket" },
  { value: "tactics", label: "Tactics" },
] as const;

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
    ...MIXED_GAME_OPTIONS,
  ].map((option) => [option.value, option.label]),
);

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
    case "501":
    case "301":
    case "701":
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

/** Empty rules shell for a game format — no preset selections. */
export function getDefaultLeagueRules(
  gameFormat: string | null | undefined,
): LeagueGameRules | null {
  const normalized = normalizeLeagueGameFormat(gameFormat);
  const family = getRulesFamilyForGameFormat(normalized);

  if (!normalized || !family) {
    return null;
  }

  switch (family) {
    case "x01":
      return {
        family: "x01",
        startingScore: null,
        startingRule: null,
        finishingRule: null,
        bustRule: null,
        matchFormat: null,
        startingPlayer: null,
      };
    case "cricket":
      return {
        family: "cricket",
        cricketVariant: null,
        scoringMode: null,
        overkillRule: null,
        matchFormat: null,
        startingPlayer: null,
      };
    case "tactics":
      return {
        family: "tactics",
        scoringMode: "traditional",
        matchFormat: null,
        startingPlayer: null,
      };
    case "mixed":
      return {
        family: "mixed",
        rotationType: null,
        games: [],
      };
    case "custom":
      return {
        family: "custom",
        customRulesText: "",
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
      const startingScore = pickNumberOrNull(raw.startingScore);
      return {
        family: "x01",
        startingScore:
          startingScore != null &&
          startingScore >= 101 &&
          startingScore <= 1001
            ? startingScore
            : null,
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
      return {
        family: "mixed",
        rotationType: pickOptionOrNull(
          raw.rotationType,
          ["random", "scheduled", "manual"] as const,
        ),
        games,
      };
    }
    case "custom":
      return {
        family: "custom",
        customRulesText:
          typeof raw.customRulesText === "string"
            ? raw.customRulesText
            : "",
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

export function leagueHasSavedRules(league: {
  game_format?: string | null;
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
  return normalized != null && validateLeagueRules(normalized) == null;
}

export function getLeagueRuleFieldGroups(
  gameFormat: string | null | undefined,
): LeagueRuleFieldGroup[] {
  const family = getRulesFamilyForGameFormat(gameFormat);
  const normalized = normalizeLeagueGameFormat(gameFormat);

  if (!family || !normalized) {
    return [];
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
        {
          id: "match",
          title: "Match Format",
          fields: [
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
        },
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
        {
          id: "match",
          title: "Match Format",
          fields: [
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
        },
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
        {
          id: "match",
          title: "Match Format",
          fields: [
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
        },
      ];
    case "mixed":
      return [
        {
          id: "rotation",
          title: "Mixed Games",
          description:
            "Choose how games rotate and which formats appear through the season.",
          fields: [
            {
              key: "rotationType",
              label: "Rotation Type",
              type: "select",
              options: [...MIXED_ROTATION_OPTIONS],
            },
            {
              key: "games",
              label: "Games in Rotation",
              type: "multiselect",
              options: [...MIXED_GAME_OPTIONS],
            },
          ],
        },
      ];
    case "custom":
      return [
        {
          id: "custom",
          title: "Custom Rules",
          description: "Define league-specific match play rules for directors and players.",
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
        },
      ];
  }
}

export function formatLeagueRulesSummaryRows(
  rules: LeagueGameRules,
  gameFormatLabel: string | null,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Game Format",
      value: gameFormatLabel ?? "Not set",
    },
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
          label: "Games",
          value: rules.games.map(labelFor).join(", ") || "None selected",
        },
      );
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

export function validateLeagueRules(rules: LeagueGameRules): string | null {
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
        return "Select a match format.";
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
        return "Select a match format.";
      }
      if (!rules.startingPlayer) {
        return "Select a starting player.";
      }
      return null;
    }
    case "tactics": {
      if (!rules.matchFormat) {
        return "Select a match format.";
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
