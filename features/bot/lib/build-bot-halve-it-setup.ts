import type { BotDifficultyId } from "@/types/bot";
import type { SavedPlayerProfile } from "@/types/player-setup";
import type {
  HalveItGameLengthPreset,
  HalveItMatchSetup,
  HalveItScoringMode,
  HalveItTargetSequenceId,
} from "@/types/halve-it";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  HALVE_IT_DEFAULT_STARTING_SCORE,
  HALVE_IT_STANDARD_ROUNDS,
  buildHalveItTargetSequence,
  resolveHalveItRoundCount,
} from "@/features/classic-games/lib/halve-it-config";
import {
  MATCH_PLAYER_COLORS,
  createSlotId,
} from "@/features/players/lib/player-setup-utils";

interface BuildBotHalveItMatchSetupInput {
  difficultyId: BotDifficultyId;
  gameLengthPreset?: HalveItGameLengthPreset;
  targetSequenceId?: HalveItTargetSequenceId;
  scoringMode?: HalveItScoringMode;
  accountPlayer?: SavedPlayerProfile | null;
}

export function buildBotHalveItMatchSetup({
  difficultyId,
  gameLengthPreset = "standard",
  targetSequenceId = "classic",
  scoringMode = "target_only",
  accountPlayer,
}: BuildBotHalveItMatchSetupInput): HalveItMatchSetup {
  const botProfile = getBotProfile(difficultyId);
  const humanName = accountPlayer?.name.trim() || "You";
  const roundCount = resolveHalveItRoundCount(gameLengthPreset, HALVE_IT_STANDARD_ROUNDS);
  const targets = buildHalveItTargetSequence(targetSequenceId, roundCount);

  return {
    startingScore: HALVE_IT_DEFAULT_STARTING_SCORE,
    roundCount,
    targetSequenceId,
    scoringMode,
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
