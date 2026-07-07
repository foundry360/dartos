import { useSettingsStore } from "@/features/settings/store/settings-store";
import {
  readPersistedSoundEnabled,
  readPersistedVoiceAnnouncementsEnabled,
} from "@/utils/sound-session-storage";

export {
  persistSoundEnabled,
  persistVoiceAnnouncementsEnabled,
  readPersistedSoundEnabled,
  readPersistedVoiceAnnouncementsEnabled,
} from "@/utils/sound-session-storage";

export function getMatchAudioPreferences(): { sound: boolean; voice: boolean } {
  const settings = useSettingsStore.getState();

  return {
    sound: settings.soundEnabled || readPersistedSoundEnabled(),
    voice: settings.voiceAnnouncementsEnabled || readPersistedVoiceAnnouncementsEnabled(),
  };
}
