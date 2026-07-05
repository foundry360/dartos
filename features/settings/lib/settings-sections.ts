export type SettingsSectionId = "appearance" | "gameplay" | "players";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "appearance",
    label: "Appearance",
    description: "Dartboard colors and visual themes",
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
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "appearance";
