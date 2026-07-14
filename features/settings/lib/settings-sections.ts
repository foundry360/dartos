import { APP_NAME } from "@/lib/theme";

export type SettingsSectionId =
  | "appearance"
  | "gameplay"
  | "players"
  | "billing"
  | "install"
  | "account";

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
    id: "install",
    label: "Install app",
    description: `Add ${APP_NAME} to your Home Screen or desktop`,
  },
  {
    id: "account",
    label: "Account",
    description: "Sign in, profile, and sign out",
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "gameplay";
