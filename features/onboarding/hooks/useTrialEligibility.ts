"use client";

import { useEffect, useState } from "react";
import { SUBSCRIPTION_TRIAL_DAYS } from "@/lib/subscription/trial";

interface TrialEligibilityState {
  trialEligible: boolean;
  trialDays: number;
  loading: boolean;
}

export function useTrialEligibility(preview = false): TrialEligibilityState {
  const [state, setState] = useState<TrialEligibilityState>({
    trialEligible: preview,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    loading: !preview,
  });

  useEffect(() => {
    if (preview) {
      setState({
        trialEligible: true,
        trialDays: SUBSCRIPTION_TRIAL_DAYS,
        loading: false,
      });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/subscription/trial-eligibility");
        const payload = (await response.json()) as {
          eligible?: boolean;
          trialDays?: number;
        };

        if (!cancelled) {
          setState({
            trialEligible: Boolean(payload.eligible),
            trialDays: payload.trialDays ?? SUBSCRIPTION_TRIAL_DAYS,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            trialEligible: false,
            trialDays: SUBSCRIPTION_TRIAL_DAYS,
            loading: false,
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [preview]);

  return state;
}
