import { APP_HOME_PATH } from "@/lib/auth/routes";

export type AppMenuIconName = "home" | "profile" | "statistics" | "settings";

export interface AppMenuItem {
  label: string;
  href: string;
  description?: string;
  icon: AppMenuIconName;
}

export interface GameCardItem {
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  icon: string;
}

export const appMenuItems: AppMenuItem[] = [
  { label: "Home", href: APP_HOME_PATH, description: "Pick a match", icon: "home" },
  { label: "Profile", href: "/profile", description: "Stats and photo", icon: "profile" },
  { label: "Statistics", href: "/statistics", description: "Averages & history", icon: "statistics" },
  { label: "Settings", href: "/settings", description: "Players & preferences", icon: "settings" },
];

import { APP_PRIMARY_COLOR } from "@/lib/theme";

export const homeGameCards: GameCardItem[] = [
  {
    title: "Cricket",
    subtitle: "Classic or Tactics",
    href: "/cricket/setup",
    accent: APP_PRIMARY_COLOR,
    icon: "◎",
  },
  {
    title: "501",
    subtitle: "Most popular X01",
    href: "/x01/501/setup",
    accent: "#3b82f6",
    icon: "501",
  },
  {
    title: "301",
    subtitle: "Quick X01 match",
    href: "/x01/301/setup",
    accent: "#8b5cf6",
    icon: "301",
  },
  {
    title: "701",
    subtitle: "Long format X01",
    href: "/x01/701/setup",
    accent: "#f59e0b",
    icon: "701",
  },
  {
    title: "Practice",
    subtitle: "Free scoring board",
    href: "/practice",
    accent: "#06b6d4",
    icon: "◎",
  },
];
