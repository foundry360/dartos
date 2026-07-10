import { getBotProfile } from "@/features/bot/lib/bot-profiles";
import {
  prepareMatchVoice,
  prepareMatchVoiceAsync,
} from "@/features/voice/lib/prepare-match-voice";
import { prefetchGameOnVoice, prefetchPlayerTurnVoice } from "@/utils/speech";

function primeBotPlayerVoices(botDisplayName: string, humanDisplayName?: string | null) {
  prefetchPlayerTurnVoice(botDisplayName);
  prefetchGameOnVoice(botDisplayName);

  const humanName = humanDisplayName?.trim();
  if (humanName) {
    prefetchPlayerTurnVoice(humanName);
    prefetchGameOnVoice(humanName);
  }
}

/** Call synchronously from the Start Match button click handler. */
export function primeBotMatchVoice(
  botDisplayName: string,
  humanDisplayName?: string | null,
  onPrime?: () => void,
) {
  prepareMatchVoice(onPrime);
  primeBotPlayerVoices(botDisplayName, humanDisplayName);
}

/** Prefer this on Start Match — awaits audio unlock before navigation. */
export async function primeBotMatchVoiceAsync(
  botDisplayName: string,
  humanDisplayName?: string | null,
  onPrime?: () => void,
): Promise<boolean> {
  const unlocked = await prepareMatchVoiceAsync(onPrime);
  primeBotPlayerVoices(botDisplayName, humanDisplayName);
  return unlocked;
}

export function primeBotMatchVoiceForDifficulty(
  difficultyId: Parameters<typeof getBotProfile>[0],
  humanDisplayName?: string | null,
) {
  primeBotMatchVoice(getBotProfile(difficultyId).displayName, humanDisplayName);
}
