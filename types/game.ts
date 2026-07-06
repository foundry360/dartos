export type GameMode =
  | "cricket"
  | "tactics"
  | "cut-throat-cricket"
  | "301"
  | "501"
  | "701"
  | "practice"
  | "around-the-clock"
  | "killer"
  | "shanghai";

export type MatchStatus = "setup" | "in-progress" | "completed" | "abandoned";

export interface MatchRecord {
  id: string;
  mode: GameMode;
  status: MatchStatus;
  playerIds: string[];
  winnerId?: string;
  startedAt: string;
  completedAt?: string;
  legs?: number;
  sets?: number;
  metadata?: Record<string, unknown>;
}
