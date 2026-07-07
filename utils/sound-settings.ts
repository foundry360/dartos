import { useSettingsStore } from "@/features/settings/store/settings-store";

const SOUND_ENABLED_SESSION_KEY = "dartos:sound-enabled";
const VOICE_ENABLED_SESSION_KEY = "dartos:voice-enabled";

export function persistSoundEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SOUND_ENABLED_SESSION_KEY, String(enabled));
  }
}

export function readPersistedSoundEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(SOUND_ENABLED_SESSION_KEY) === "true";
}

export function persistVoiceAnnouncementsEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(VOICE_ENABLED_SESSION_KEY, String(enabled));
  }
}

export function readPersistedVoiceAnnouncementsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(VOICE_ENABLED_SESSION_KEY) === "true";
}

export function getMatchAudioPreferences(): { sound: boolean; voice: boolean } {
  const settings = useSettingsStore.getState();

  return {
    sound: settings.soundEnabled || readPersistedSoundEnabled(),
    voice: settings.voiceAnnouncementsEnabled || readPersistedVoiceAnnouncementsEnabled(),
  };
}
