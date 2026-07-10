import type { BotDifficultyId } from "@/types/bot";
import type { SavedPlayerProfile } from "@/types/player-setup";
import type {
  ShanghaiGameLengthPreset,
  ShanghaiMatchSetup,
  ShanghaiRule,
  ShanghaiWinningMode,
} from "@/types/shanghai";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  SHANGHAI_DEFAULT_STARTING_SCORE,
  buildShanghaiTargetSequence,
  resolveShanghaiBullIncluded,
  resolveShanghaiNumberRounds,
} from "@/features/classic-games/lib/shanghai-config";
import {
  MATCH_PLAYER_COLORS,
  createSlotId,
} from "@/features/players/lib/player-setup-utils";

interface BuildBotShanghaiMatchSetupInput {
  difficultyId: BotDifficultyId;
  gameLengthPreset?: ShanghaiGameLengthPreset;
  shanghaiRule?: ShanghaiRule;
  winningMode?: ShanghaiWinningMode;
  accountPlayer?: SavedPlayerProfile | null;
}

export function buildBotShanghaiMatchSetup({
  difficultyId,
  gameLengthPreset = "classic",
  shanghaiRule = "bonus_points",
  winningMode = "highest_score",
  accountPlayer,
}: BuildBotShanghaiMatchSetupInput): ShanghaiMatchSetup {
  const botProfile = getBotProfile(difficultyId);
  const humanName = accountPlayer?.name.trim() || "You";
  const numberRounds = resolveShanghaiNumberRounds(gameLengthPreset, 20);
  const bullRoundIncluded = resolveShanghaiBullIncluded(gameLengthPreset, false);
  const targets = buildShanghaiTargetSequence(
    gameLengthPreset,
    numberRounds,
    bullRoundIncluded,
  );

  return {
    startingScore: SHANGHAI_DEFAULT_STARTING_SCORE,
    roundCount: targets.length,
    gameLengthPreset,
    bullRoundIncluded,
    shanghaiRule,
    winningMode,
    targets,
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
