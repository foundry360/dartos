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

  void unlockVoicePlayback();

  return ensureVisitScoreClipReady(visitTotal, busted);
}
