import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import type { X01GameType } from "@/lib/constants";
import type { BotDifficultyId } from "@/types/bot";
import type { SavedPlayerProfile, X01MatchSetup } from "@/types/player-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  MATCH_PLAYER_COLORS,
  createSlotId,
} from "@/features/players/lib/player-setup-utils";

interface BuildBotX01MatchSetupInput {
  gameType: X01GameType;
  difficultyId: BotDifficultyId;
  legsToWin?: number;
  accountPlayer?: SavedPlayerProfile | null;
}

export function buildBotX01MatchSetup({
  gameType,
  difficultyId,
  legsToWin = DEFAULT_LEGS,
  accountPlayer,
}: BuildBotX01MatchSetupInput): X01MatchSetup {
  const botProfile = getBotProfile(difficultyId);
  const humanName = accountPlayer?.name.trim() || "You";

  return {
    gameType,
    legsToWin,
    setsToWin: DEFAULT_SETS,
    teamsEnabled: false,
    teamNames: ["Team 1", "Team 2"],
    startingPlayerRule: "rotate_each_leg",
    inRule: "straight_in",
    outRule: "double_out",
    isBotMatch: true,
    players: [
      {
        id: createSlotId(),
        name: humanName,
        nickname: accountPlayer?.nickname ?? null,
        source: accountPlayer ? "profile" : "guest",
        profileId: accountPlayer?.id,
        color: accountPlayer?.color ?? MATCH_PLAYER_COLORS[0],
        avatarUrl: accountPlayer?.avatarUrl ?? undefined,
        teamId: 0,
        filled: true,
      },
      {
        id: createSlotId(),
        name: botProfile.displayName,
        source: "bot",
        botDifficultyId: difficultyId,
        color: MATCH_PLAYER_COLORS[1],
        teamId: 1,
        filled: true,
      },
    ],
  };
}

export function isBotPlayer(
  player: { playerKind?: "human" | "bot"; botDifficultyId?: string } | undefined,
): boolean {
  return player?.playerKind === "bot" || player?.botDifficultyId != null;
}
