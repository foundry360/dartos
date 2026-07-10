import { DEFAULT_LEGS, DEFAULT_SETS, type CricketVariant } from "@/lib/constants";
import type { BotDifficultyId } from "@/types/bot";
import type { CricketMatchSetup, SavedPlayerProfile } from "@/types/player-setup";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  MATCH_PLAYER_COLORS,
  createSlotId,
} from "@/features/players/lib/player-setup-utils";

interface BuildBotCricketMatchSetupInput {
  variant: CricketVariant;
  difficultyId: BotDifficultyId;
  legsToWin?: number;
  accountPlayer?: SavedPlayerProfile | null;
}

export function buildBotCricketMatchSetup({
  variant,
  difficultyId,
  legsToWin = DEFAULT_LEGS,
  accountPlayer,
}: BuildBotCricketMatchSetupInput): CricketMatchSetup {
  const botProfile = getBotProfile(difficultyId);
  const humanName = accountPlayer?.name.trim() || "You";

  return {
    variant,
    legsToWin,
    setsToWin: DEFAULT_SETS,
    teamsEnabled: false,
    teamNames: ["Team 1", "Team 2"],
    startingPlayerRule: "rotate_each_leg",
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
