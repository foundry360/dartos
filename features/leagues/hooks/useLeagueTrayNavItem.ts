"use client";

import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import type { AppMenuIconName, AppMenuItem } from "@/lib/app-navigation";
import {
  LEAGUE_LIST_PATH,
  LEAGUE_MANAGEMENT_PATH,
  LEAGUE_PLAY_PATH,
} from "@/lib/auth/routes";

/** Existing leagues tray slot (star). Unchanged for Club/Elite and League Pro management. */
export function getLeagueTrayNavItem(canManageLeagues: boolean): AppMenuItem {
  if (canManageLeagues) {
    return {
      label: "League Management",
      href: LEAGUE_MANAGEMENT_PATH,
      description: "Venues, seasons, and competition admin",
      icon: "leagues" satisfies AppMenuIconName,
    };
  }

  return {
    label: "Leagues",
    href: LEAGUE_PLAY_PATH,
    description: "Local leagues and tournaments",
    icon: "leagues" satisfies AppMenuIconName,
  };
}

/** League Pro only — additional tray icon → leagues-only list. */
export function getLeagueListTrayNavItem(): AppMenuItem {
  return {
    label: "Leagues",
    href: LEAGUE_LIST_PATH,
    description: "Your leagues",
    icon: "leagueList" satisfies AppMenuIconName,
  };
}

/** Uses shared subscription cache so League Pro tray does not flash Club/Elite on nav. */
export function useLeagueTrayNavItem() {
  const { allowed: canManageLeagues, loading } = useLeagueManagementAccess();

  return {
    loading,
    canManageLeagues,
    item: getLeagueTrayNavItem(canManageLeagues),
    /** Present only for League Pro — separate icon for leagues-only list. */
    listItem: canManageLeagues ? getLeagueListTrayNavItem() : null,
  };
}
