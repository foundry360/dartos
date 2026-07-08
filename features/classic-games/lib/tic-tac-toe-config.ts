import type {
  TicTacToeBoardLayoutId,
  TicTacToeCell,
  TicTacToeClaimRules,
  TicTacToeMatchFormat,
} from "@/types/tic-tac-toe";
import type { PillToggleOption } from "@/components/ui/PillToggleGroup";

export const TIC_TAC_TOE_BOARD_LAYOUT_OPTIONS: PillToggleOption<TicTacToeBoardLayoutId>[] = [
  { value: "standard", label: "Standard" },
  { value: "numbers_12_20", label: "Numbers 12–20" },
];

export const TIC_TAC_TOE_CLAIM_RULES_OPTIONS: PillToggleOption<TicTacToeClaimRules>[] = [
  { value: "beginner", label: "Beginner" },
  { value: "advanced", label: "Advanced" },
];

export const TIC_TAC_TOE_MATCH_FORMAT_OPTIONS: PillToggleOption<TicTacToeMatchFormat>[] = [
  { value: "single", label: "Single game" },
  { value: "best_of_3", label: "Best of 3" },
  { value: "best_of_5", label: "Best of 5" },
];

const STANDARD_LAYOUT = [
  [20, 19, 18],
  [17, 16, 15],
  [14, 13, 12],
] as const;

const NUMBERS_12_20_LAYOUT = [
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
] as const;

export function resolveTicTacToeGamesToWin(matchFormat: TicTacToeMatchFormat): number {
  switch (matchFormat) {
    case "single":
      return 1;
    case "best_of_3":
      return 2;
    case "best_of_5":
      return 3;
  }
}

export function buildTicTacToeBoard(layoutId: TicTacToeBoardLayoutId): TicTacToeCell[] {
  const layout = layoutId === "numbers_12_20" ? NUMBERS_12_20_LAYOUT : STANDARD_LAYOUT;
  const cells: TicTacToeCell[] = [];

  for (let row = 0; row < layout.length; row += 1) {
    for (let col = 0; col < layout[row]!.length; col += 1) {
      cells.push({
        row,
        col,
        segment: layout[row]![col]!,
        owner: null,
      });
    }
  }

  return cells;
}

export function getTicTacToeBoardSegments(layoutId: TicTacToeBoardLayoutId): number[] {
  return buildTicTacToeBoard(layoutId).map((cell) => cell.segment);
}
