import { MIN_PLAYERS } from "@/lib/constants";
import type { PlayerSetupSlot } from "@/types/player-setup";

export const MATCH_PLAYER_COLORS = [
  "#6f9e24",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
] as const;

export function createSlotId() {
  return `slot-${crypto.randomUUID()}`;
}

export function createEmptySlot(index: number, teamId = index % 2): PlayerSetupSlot {
  return {
    id: createSlotId(),
    name: "",
    source: "guest",
    teamId,
    filled: false,
  };
}

export function createInitialSlots(count: number) {
  return Array.from({ length: count }, (_, index) => createEmptySlot(index));
}

export function isSlotFilled(slot: PlayerSetupSlot): boolean {
  return slot.filled === true;
}

export function isGenericPlaceholderPlayerName(name: string): boolean {
  return /^player \d+$/i.test(name.trim());
}

export function canRemovePlayers(slots: PlayerSetupSlot[]): boolean {
  return slots.length > MIN_PLAYERS;
}

export function resolveFilledSlots(slots: PlayerSetupSlot[]) {
  return slots
    .filter(isSlotFilled)
    .map((slot, index) => ({
      ...slot,
      name: slot.name.trim() || `Player ${index + 1}`,
    }));
}

export function getSlotColor(slot: PlayerSetupSlot, slotIndex: number) {
  return slot.color ?? MATCH_PLAYER_COLORS[slotIndex % MATCH_PLAYER_COLORS.length]!;
}
