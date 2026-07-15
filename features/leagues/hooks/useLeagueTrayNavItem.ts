"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AppMenuIconName, AppMenuItem } from "@/lib/app-navigation";
import { LEAGUE_MANAGEMENT_PATH, LEAGUE_PLAY_PATH } from "@/lib/auth/routes";

interface SubscriptionStatusResponse {
  leagueManagement?: boolean;
}

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

export function useLeagueTrayNavItem() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canManageLeagues, setCanManageLeagues] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setCanManageLeagues(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/subscription/status", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as SubscriptionStatusResponse;

        if (!cancelled) {
          setCanManageLeagues(Boolean(payload.leagueManagement));
        }
      } catch {
        if (!cancelled) {
          setCanManageLeagues(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return {
    loading: authLoading || loading,
    canManageLeagues,
    item: getLeagueTrayNavItem(canManageLeagues),
  };
}
