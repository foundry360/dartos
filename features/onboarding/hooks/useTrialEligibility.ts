"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlanId } from "@/features/onboarding/lib/subscription-plans";
import {
  CLUB_ELITE_TRIAL_DAYS,
  getTrialDaysForPlan,
  planAllowsNoCardTrial,
} from "@/lib/subscription/trial";

interface TrialEligibilityState {
  trialEligible: boolean;
  trialDays: number;
  noCardTrial: boolean;
  requiresCard: boolean;
  loading: boolean;
}

export function useTrialEligibility(
  preview = false,
  planId: SubscriptionPlanId | null = null,
): TrialEligibilityState {
  const fallbackDays = planId ? getTrialDaysForPlan(planId) : CLUB_ELITE_TRIAL_DAYS;

  const [state, setState] = useState<TrialEligibilityState>({
    trialEligible: preview,
    trialDays: fallbackDays,
    noCardTrial: Boolean(preview && planId && planAllowsNoCardTrial(planId)),
    requiresCard: Boolean(planId && !planAllowsNoCardTrial(planId)),
    loading: !preview,
  });

  useEffect(() => {
    if (preview) {
      setState({
        trialEligible: true,
        trialDays: planId ? getTrialDaysForPlan(planId) : CLUB_ELITE_TRIAL_DAYS,
        noCardTrial: Boolean(planId && planAllowsNoCardTrial(planId)),
        requiresCard: Boolean(planId && !planAllowsNoCardTrial(planId)),
        loading: false,
      });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const query = planId ? `?plan=${encodeURIComponent(planId)}` : "";
        const response = await fetch(`/api/subscription/trial-eligibility${query}`);
        const payload = (await response.json()) as {
          eligible?: boolean;
          trialDays?: number;
          noCardTrial?: boolean;
          requiresCard?: boolean;
        };

        if (!cancelled) {
          setState({
            trialEligible: Boolean(payload.eligible),
            trialDays: payload.trialDays ?? (planId ? getTrialDaysForPlan(planId) : CLUB_ELITE_TRIAL_DAYS),
            noCardTrial: Boolean(payload.noCardTrial),
            requiresCard: Boolean(payload.requiresCard),
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            trialEligible: false,
            trialDays: planId ? getTrialDaysForPlan(planId) : CLUB_ELITE_TRIAL_DAYS,
            noCardTrial: false,
            requiresCard: Boolean(planId && !planAllowsNoCardTrial(planId)),
            loading: false,
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [planId, preview]);

  return state;
}
