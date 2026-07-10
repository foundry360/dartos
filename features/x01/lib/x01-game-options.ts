import { X01_GAME_TYPES, type X01GameType } from "@/lib/constants";

export type X01GameTypeOptionValue = `${X01GameType}`;

export const X01_GAME_TYPE_OPTIONS = X01_GAME_TYPES.map((gameType) => ({
  value: String(gameType) as X01GameTypeOptionValue,
  label: String(gameType),
}));

export function x01GameTypeToOptionValue(gameType: X01GameType): X01GameTypeOptionValue {
  return String(gameType) as X01GameTypeOptionValue;
}

export function parseX01GameTypeOptionValue(value: X01GameTypeOptionValue): X01GameType {
  return Number(value) as X01GameType;
}
