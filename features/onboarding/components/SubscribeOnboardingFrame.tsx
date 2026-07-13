"use client";

import type { ReactNode } from "react";
import { AuthBrandLogo } from "@/features/auth/components/AuthBrandLogo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import {
  getSubscribeOnboardingSteps,
  OnboardingStepper,
  type SubscribeOnboardingStep,
} from "@/features/onboarding/components/OnboardingStepper";

interface SubscribeOnboardingFrameProps {
  title: ReactNode;
  subtitle?: ReactNode;
  step: SubscribeOnboardingStep;
  accountEmail: string;
  preview?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onSignOut: () => void;
}

export function SubscribeOnboardingFrame({
  title,
  subtitle,
  step,
  accountEmail,
  preview = false,
  children,
  footer,
  onSignOut,
}: SubscribeOnboardingFrameProps) {
  return (
    <AuthShell wide compact={step === "payment"}>
      <AuthBrandLogo />

      <OnboardingStepper steps={getSubscribeOnboardingSteps(step)} />

      {subtitle ? (
        <>
          <h1 className="auth-screen__title auth-screen__title--solo">{title}</h1>
          <p className="auth-screen__tagline">{subtitle}</p>
        </>
      ) : (
        <h1 className="auth-screen__title auth-screen__title--solo auth-screen__title--spaced">{title}</h1>
      )}

      {children}

      {footer ? <div className="onboarding-screen__actions">{footer}</div> : null}

      <p className="auth-screen__footer">
        Signed in as {accountEmail}.{" "}
        {preview ? (
          <span className="onboarding-screen__preview-note">Preview mode</span>
        ) : (
          <button type="button" className="auth-screen__footer-link" onClick={() => void onSignOut()}>
            Use a different account
          </button>
        )}
      </p>
    </AuthShell>
  );
}

export function SubscribeOnboardingLoading() {
  return (
    <AuthShell wide>
      <p className="onboarding-screen__status">Loading…</p>
    </AuthShell>
  );
}

function PlanFeatureCheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PlanFeatureList({ features }: { features: string[] }) {
  return (
    <ul className="onboarding-plan-features">
      {features.map((feature) => (
        <li key={feature}>
          <PlanFeatureCheckIcon />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
