import { APP_HOME_PATH } from "@/lib/auth/routes";

export type AppMenuIconName =
  | "home"
  | "bullseye"
  | "profile"
  | "statistics"
  | "matchPlay"
  | "settings"
  | "help";

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
  { label: "Home", href: APP_HOME_PATH, description: "Pick a match", icon: "bullseye" },
  { label: "Profile", href: "/profile", description: "Player card and identity", icon: "profile" },
  { label: "Matches", href: "/match-play", description: "Match records", icon: "matchPlay" },
  { label: "Statistics", href: "/statistics", description: "Averages & history", icon: "statistics" },
  { label: "Settings", href: "/settings", description: "Players & preferences", icon: "settings" },
  { label: "Get Started", href: "/help", description: "Guides for scoring, practice, and competition", icon: "help" },
];

export const bottomNavItems: AppMenuItem[] = [
  { label: "Home", href: APP_HOME_PATH, icon: "bullseye" },
  { label: "Matches", href: "/match-play", icon: "matchPlay" },
  { label: "Stats", href: "/statistics", icon: "statistics" },
  { label: "Profile", href: "/profile", icon: "profile" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export function isAppNavItemActive(pathname: string, href: string): boolean {
  return href === APP_HOME_PATH
    ? pathname === APP_HOME_PATH
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Hide on active dartboard scoring screens only (ScoringLayout). */
export function shouldShowBottomNav(shellClassName?: string): boolean {
  return !shellClassName?.includes("scoring-layout-shell");
}

import { APP_PRIMARY_COLOR } from "@/lib/theme";

export const homeGameCardRows: GameCardItem[][] = [
  [
    {
      title: "Match Play",
      subtitle: "Cricket, Tactics, X01",
      href: "/play/setup",
      accent: APP_PRIMARY_COLOR,
      icon: "◎",
    },
    {
      title: "Practice",
      subtitle: "Drills and routines",
      href: "/practice/setup",
      accent: "#06b6d4",
      icon: "◎",
    },
  ],
];
