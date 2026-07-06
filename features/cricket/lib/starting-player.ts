import type { CricketStartingPlayerRule } from "@/types/cricket";

interface LegStarterContext {
  playerCount: number;
  legNumber: number;
  lastLegWinnerIndex?: number;
  coinTossStarterIndex?: number;
}

export function resolveLegStarterIndex(
  rule: CricketStartingPlayerRule,
  context: LegStarterContext,
): number {
  const { playerCount, legNumber, lastLegWinnerIndex, coinTossStarterIndex } = context;

  if (playerCount <= 0) {
    return 0;
  }

  switch (rule) {
    case "random":
      return Math.floor(Math.random() * playerCount);
    case "winner_previous_leg":
      if (legNumber === 1) {
        return coinTossStarterIndex ?? 0;
      }

      return lastLegWinnerIndex ?? 0;
    case "rotate_each_leg":
      return (legNumber - 1) % playerCount;
    case "coin_toss":
      if (legNumber === 1 && coinTossStarterIndex != null) {
        return coinTossStarterIndex;
      }

      return lastLegWinnerIndex ?? coinTossStarterIndex ?? 0;
  }
}

export const STARTING_PLAYER_RULE_OPTIONS: Array<{
  id: CricketStartingPlayerRule;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "random",
    label: "Random",
    shortLabel: "Random",
    description: "Pick a random starter for each new leg.",
  },
  {
    id: "winner_previous_leg",
    label: "Winner of previous leg",
    shortLabel: "Prev leg",
    description: "The player or team that won the last leg throws first.",
  },
  {
    id: "rotate_each_leg",
    label: "Rotate each leg",
    shortLabel: "Rotate",
    description: "Move the starting player one spot in order every leg.",
  },
  {
    id: "coin_toss",
    label: "Coin toss",
    shortLabel: "Coin toss",
    description: "Flip for who starts leg 1, then follow the previous-leg winner.",
  },
];
