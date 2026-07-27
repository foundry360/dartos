import type { CricketVariant, X01GameType } from "@/lib/constants";
import type { MatchStartingPlayerRule } from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";
import { STARTING_PLAYER_RULE_OPTIONS } from "@/features/players/lib/starting-player";

export type CommunityGameMode = "x01" | "cricket";

export interface CommunityX01Rules {
  gameType: X01GameType;
  legsToWin: number;
  setsToWin: number;
  inRule: X01InRule;
  outRule: X01OutRule;
  startingPlayerRule: MatchStartingPlayerRule;
}

export interface CommunityCricketRules {
  variant: CricketVariant;
  legsToWin: number;
  setsToWin: number;
  startingPlayerRule: MatchStartingPlayerRule;
}

export type CommunityMatchRules = CommunityX01Rules | CommunityCricketRules;

export interface CommunityMatchConfig {
  gameType: CommunityGameMode;
  rules: CommunityMatchRules;
}

export const DEFAULT_COMMUNITY_X01_RULES: CommunityX01Rules = {
  gameType: 501,
  legsToWin: 3,
  setsToWin: 1,
  inRule: "straight_in",
  outRule: "double_out",
  startingPlayerRule: "winner_previous_leg",
};

export const DEFAULT_COMMUNITY_CRICKET_RULES: CommunityCricketRules = {
  variant: "classic",
  legsToWin: 3,
  setsToWin: 1,
  startingPlayerRule: "winner_previous_leg",
};

function formatBestOf(legsToWin: number, setsToWin: number) {
  if (setsToWin > 1) {
    return `${setsToWin} set${setsToWin === 1 ? "" : "s"} · ${legsToWin} leg${legsToWin === 1 ? "" : "s"}`;
  }
  return `Best of ${legsToWin * 2 - 1}`;
}

export function communityMatchGameLabel(
  gameType: string | null | undefined,
  rules: Record<string, unknown> | null | undefined,
): string {
  if (gameType === "x01") {
    const score = typeof rules?.gameType === "number" ? rules.gameType : 501;
    return String(score);
  }
  if (gameType === "cricket") {
    return rules?.variant === "tactics" ? "Tactics" : "Cricket";
  }
  return "Match";
}

export function communityMatchFormatLabel(
  gameType: string | null | undefined,
  rules: Record<string, unknown> | null | undefined,
): string {
  const legs = typeof rules?.legsToWin === "number" ? rules.legsToWin : 3;
  const sets = typeof rules?.setsToWin === "number" ? rules.setsToWin : 1;
  if (!gameType) {
    return formatBestOf(legs, sets);
  }
  return formatBestOf(legs, sets).toUpperCase();
}

export function formatCommunityMatchConfig(
  gameType: string | null | undefined,
  rules: Record<string, unknown> | null | undefined,
): string {
  if (!gameType || !rules) {
    return "Match";
  }

  if (gameType === "x01") {
    const score = typeof rules.gameType === "number" ? rules.gameType : 501;
    const legs = typeof rules.legsToWin === "number" ? rules.legsToWin : 3;
    const sets = typeof rules.setsToWin === "number" ? rules.setsToWin : 1;
    const out =
      rules.outRule === "double_out"
        ? "DO"
        : rules.outRule === "straight_out"
          ? "SO"
          : "";
    return [`X01 ${score}`, formatBestOf(legs, sets), out].filter(Boolean).join(" · ");
  }

  if (gameType === "cricket") {
    const variant = rules.variant === "tactics" ? "Tactics" : "Cricket";
    const legs = typeof rules.legsToWin === "number" ? rules.legsToWin : 3;
    const sets = typeof rules.setsToWin === "number" ? rules.setsToWin : 1;
    return `${variant} · ${formatBestOf(legs, sets)}`;
  }

  return "Match";
}

export function startingPlayerRuleLabel(rule: MatchStartingPlayerRule) {
  return (
    STARTING_PLAYER_RULE_OPTIONS.find((option) => option.id === rule)?.label ??
    "Winner of previous leg"
  );
}

export function isCommunityX01Rules(rules: CommunityMatchRules): rules is CommunityX01Rules {
  return "gameType" in rules && typeof rules.gameType === "number";
}
