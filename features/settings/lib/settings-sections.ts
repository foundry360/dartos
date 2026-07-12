export type SettingsSectionId = "appearance" | "gameplay" | "players" | "billing" | "account";

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "gameplay",
    label: "Gameplay",
    description: "Scoring feedback and turn behavior",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "",
  },
  {
    id: "players",
    label: "Players",
    description: "Profiles and saved opponents",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Payment methods and billing history",
  },
  {
    id: "account",
    label: "Account",
    description: "Sign in, profile, and sign out",
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "gameplay";
