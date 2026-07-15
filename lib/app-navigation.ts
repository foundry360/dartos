import { APP_HOME_PATH, LEAGUE_MANAGEMENT_PATH, LEAGUE_PLAY_PATH } from "@/lib/auth/routes";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

export type AppMenuIconName =
  | "home"
  | "bullseye"
  | "profile"
  | "statistics"
  | "matchPlay"
  | "organizations"
  | "leagues"
  | "leaguePlay"
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
  {
    label: "Leagues",
    href: LEAGUE_PLAY_PATH,
    description: "Local leagues and tournaments",
    icon: "leagues",
  },
  { label: "Settings", href: "/settings", description: "Players & preferences", icon: "settings" },
  { label: "Get Started", href: "/help", description: "Guides for scoring, practice, and competition", icon: "help" },
];

export const bottomNavItems: AppMenuItem[] = [
  { label: "Home", href: APP_HOME_PATH, icon: "bullseye" },
  { label: "Matches", href: "/match-play", icon: "matchPlay" },
  { label: "Stats", href: "/statistics", icon: "statistics" },
  { label: "Profile", href: "/profile", icon: "profile" },
  {
    label: "Leagues",
    href: LEAGUE_PLAY_PATH,
    icon: "leagues",
  },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export function withLeagueNavItem(
  items: AppMenuItem[],
  leagueItem: AppMenuItem,
): AppMenuItem[] {
  return items.map((item) => {
    if (
      item.href === LEAGUE_PLAY_PATH ||
      item.href === LEAGUE_MANAGEMENT_PATH ||
      item.icon === "leagues" ||
      item.icon === "leaguePlay"
    ) {
      return leagueItem;
    }

    return item;
  });
}

export function isAppNavItemActive(pathname: string, href: string): boolean {
  if (href === APP_HOME_PATH) {
    return pathname === APP_HOME_PATH;
  }

  if (href === LEAGUE_MANAGEMENT_PATH) {
    return pathname === LEAGUE_MANAGEMENT_PATH || pathname.startsWith(`${LEAGUE_MANAGEMENT_PATH}/`);
  }

  if (href === LEAGUE_PLAY_PATH) {
    return pathname === LEAGUE_PLAY_PATH || pathname.startsWith(`${LEAGUE_PLAY_PATH}/`);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Hide on active dartboard scoring screens only (ScoringLayout). */
export function shouldShowBottomNav(shellClassName?: string): boolean {
  return !shellClassName?.includes("scoring-layout-shell");
}

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
