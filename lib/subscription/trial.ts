import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import type { AppliedSubscriptionCoupon } from "@/features/onboarding/lib/subscription-coupons";

export const SUBSCRIPTION_TRIAL_DAYS = 7;

const ZERO_DUE_LABEL = "$0.00";

export function formatSubscriptionDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTrialEndDate(trialDays = SUBSCRIPTION_TRIAL_DAYS, from = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + trialDays);
  return end;
}

export function getTrialEndLabel(trialDays = SUBSCRIPTION_TRIAL_DAYS): string {
  return formatSubscriptionDate(getTrialEndDate(trialDays));
}

export function getFirstChargeLabel(trialEligible: boolean, trialDays = SUBSCRIPTION_TRIAL_DAYS): string {
  if (!trialEligible) {
    return "Today";
  }

  return `After ${trialDays}-day trial`;
}

export function getSubscriptionRenewalLabel(
  planId: SubscriptionPlanId,
  options?: { trialEligible?: boolean; trialDays?: number },
): string {
  if (options?.trialEligible) {
    return getTrialEndLabel(options.trialDays ?? SUBSCRIPTION_TRIAL_DAYS);
  }

  const plan = getSubscriptionPlan(planId);
  const renewal = new Date();

  if (plan.intervalLabel.includes("year")) {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else {
    renewal.setMonth(renewal.getMonth() + 1);
  }

  return formatSubscriptionDate(renewal);
}

export function resolveSubscribeDueTodayLabel(
  planPriceLabel: string,
  appliedCoupon: AppliedSubscriptionCoupon | null | undefined,
  trialEligible: boolean,
): string {
  if (trialEligible) {
    return ZERO_DUE_LABEL;
  }

  return appliedCoupon?.finalPriceLabel ?? planPriceLabel;
}

export function isZeroDueTodayLabel(label: string): boolean {
  return label.trim() === ZERO_DUE_LABEL;
}

export function getSubscribePaymentButtonLabel(
  dueTodayLabel: string,
  trialEligible: boolean,
  submitting: boolean,
): string {
  if (submitting) {
    return "Please wait...";
  }

  if (trialEligible && isZeroDueTodayLabel(dueTodayLabel)) {
    return "Start free trial";
  }

  if (isZeroDueTodayLabel(dueTodayLabel)) {
    return "Subscribe";
  }

  return `Pay ${dueTodayLabel}`;
}
