"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";

interface SubscriptionStatusResponse {
  active?: boolean;
  plan?: SubscriptionPlanId | null;
  elite?: boolean;
  leaguePlay?: boolean;
  leagueManagement?: boolean;
}

interface LeagueManagementAccessCache {
  userId: string;
  allowed: boolean;
  leaguePlay: boolean;
  plan: SubscriptionPlanId | null;
}

/** Survives AppChrome remounts between routes so League Pro UI does not flash. */
let accessCache: LeagueManagementAccessCache | null = null;

export function useLeagueManagementAccess() {
  const { user, loading: authLoading } = useAuth();
  const cached = user && accessCache?.userId === user.id ? accessCache : null;
  const [loading, setLoading] = useState(!cached);
  const [allowed, setAllowed] = useState(cached?.allowed ?? false);
  const [leaguePlay, setLeaguePlay] = useState(cached?.leaguePlay ?? false);
  const [plan, setPlan] = useState<SubscriptionPlanId | null>(cached?.plan ?? null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      accessCache = null;
      setAllowed(false);
      setLeaguePlay(false);
      setPlan(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const hasFreshCache = accessCache?.userId === user.id;

    const load = async () => {
      if (!hasFreshCache) {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/subscription/status", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as SubscriptionStatusResponse;

        if (cancelled) {
          return;
        }

        const nextAllowed = Boolean(payload.leagueManagement);
        const nextLeaguePlay = Boolean(payload.leaguePlay);
        const nextPlan = payload.plan ?? null;

        accessCache = {
          userId: user.id,
          allowed: nextAllowed,
          leaguePlay: nextLeaguePlay,
          plan: nextPlan,
        };

        setAllowed(nextAllowed);
        setLeaguePlay(nextLeaguePlay);
        setPlan(nextPlan);
      } catch {
        if (!cancelled) {
          if (!hasFreshCache) {
            setAllowed(false);
            setLeaguePlay(false);
            setPlan(null);
          }
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
    allowed,
    leaguePlay,
    plan,
    isElite: plan === "elite" || plan === "league_pro",
    isLeaguePro: plan === "league_pro",
  };
}
