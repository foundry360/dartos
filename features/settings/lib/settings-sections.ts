export type SettingsSectionId = "appearance" | "gameplay" | "players" | "account";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "appearance",
    label: "Appearance",
    description: "",
  },
  {
    id: "gameplay",
    label: "Gameplay",
    description: "Scoring feedback and turn behavior",
  },
  {
    id: "players",
    label: "Players",
    description: "Profiles and saved opponents",
  },
  {
    id: "account",
    label: "Account",
    description: "Sign in, profile, and sign out",
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "appearance";
