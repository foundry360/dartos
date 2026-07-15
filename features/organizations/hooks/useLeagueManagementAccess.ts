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

export function useLeagueManagementAccess() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [leaguePlay, setLeaguePlay] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setAllowed(false);
      setLeaguePlay(false);
      setPlan(null);
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

        if (cancelled) {
          return;
        }

        setAllowed(Boolean(payload.leagueManagement));
        setLeaguePlay(Boolean(payload.leaguePlay));
        setPlan(payload.plan ?? null);
      } catch {
        if (!cancelled) {
          setAllowed(false);
          setLeaguePlay(false);
          setPlan(null);
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
