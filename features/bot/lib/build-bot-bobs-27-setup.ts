import type { BotDifficultyId } from "@/types/bot";
import type { SavedPlayerProfile } from "@/types/player-setup";
import type {
  Bobs27GameLengthPreset,
  Bobs27MatchSetup,
  Bobs27TargetTypeId,
} from "@/types/bobs-27";
import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  BOBS_27_DEFAULT_STARTING_SCORE,
  BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS,
  buildBobs27TargetSequence,
  resolveBobs27RoundCount,
} from "@/features/classic-games/lib/bobs-27-config";
import {
  MATCH_PLAYER_COLORS,
  createSlotId,
} from "@/features/players/lib/player-setup-utils";

interface BuildBotBobs27MatchSetupInput {
  difficultyId: BotDifficultyId;
  targetTypeId?: Bobs27TargetTypeId;
  gameLengthPreset?: Bobs27GameLengthPreset;
  eliminationEnabled?: boolean;
  accountPlayer?: SavedPlayerProfile | null;
}

export function buildBotBobs27MatchSetup({
  difficultyId,
  targetTypeId = "doubles_bull",
  gameLengthPreset = "standard",
  eliminationEnabled = true,
  accountPlayer,
}: BuildBotBobs27MatchSetupInput): Bobs27MatchSetup {
  const botProfile = getBotProfile(difficultyId);
  const humanName = accountPlayer?.name.trim() || "You";
  const roundCount = resolveBobs27RoundCount(
    gameLengthPreset,
    targetTypeId,
    BOBS_27_STANDARD_DOUBLES_BULL_ROUNDS,
  );
  const targets = buildBobs27TargetSequence(targetTypeId, roundCount);

  return {
    startingScore: BOBS_27_DEFAULT_STARTING_SCORE,
    roundCount,
    targetTypeId,
    eliminationEnabled,
    playerMode: "multiplayer",
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
