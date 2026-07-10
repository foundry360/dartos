import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { ensureVisitScoreClipReady } from "@/utils/score-audio";
import { unlockVoicePlayback } from "@/utils/voice-playback";

/** Unlock autoplay and prefetch the visit score clip before bot score callouts. */
export async function prepareBotVisitScoreAudio(
  visitTotal: number,
  busted = false,
): Promise<boolean> {
  if (!getMatchAudioPreferences().voice) {
    return false;
  }

  const unlocked = await unlockVoicePlayback();
  if (!unlocked) {
    return false;
  }

  return ensureVisitScoreClipReady(visitTotal, busted);
}
