import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { ensureVisitScoreClipReady } from "@/utils/score-audio";
import { isVoicePlaybackUnlocked, unlockVoicePlayback } from "@/utils/voice-playback";

/** Unlock autoplay and prefetch the visit score clip before bot score callouts. */
export async function prepareBotVisitScoreAudio(
  visitTotal: number,
  busted = false,
): Promise<boolean> {
  if (!getMatchAudioPreferences().voice) {
    return false;
  }

  if (!isVoicePlaybackUnlocked()) {
    const unlocked = await unlockVoicePlayback();
    if (!unlocked && !isVoicePlaybackUnlocked()) {
      return false;
    }
  }

  return ensureVisitScoreClipReady(visitTotal, busted);
}
