import { Fragment, type CSSProperties } from "react";
import { cn } from "@/utils/cn";

type StepStatus = "complete" | "current" | "upcoming";

interface OnboardingStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface OnboardingStepperProps {
  steps: OnboardingStep[];
}

export type SubscribeOnboardingStep = "plan" | "confirm" | "payment";

function getFlowStepStatus(stepIndex: number, currentIndex: number): StepStatus {
  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function StepMarker({ status, index }: { status: StepStatus; index: number }) {
  if (status === "complete") {
    return (
      <span className="onboarding-stepper__marker onboarding-stepper__marker--complete" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.25 4.75 8.5 9.5 3.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "onboarding-stepper__marker",
        status === "current" && "onboarding-stepper__marker--current",
        status === "upcoming" && "onboarding-stepper__marker--upcoming",
      )}
      aria-hidden
    >
      {index + 1}
    </span>
  );
}

export function OnboardingStepper({ steps }: OnboardingStepperProps) {
  const connectorCount = Math.max(steps.length - 1, 0);
  const gridColumns =
    connectorCount > 0
      ? `auto ${Array.from({ length: connectorCount }, () => "1fr auto").join(" ")}`
      : "auto";

  return (
    <ol
      className="onboarding-stepper"
      aria-label="Onboarding progress"
      style={
        {
          "--stepper-columns": gridColumns,
        } as CSSProperties
      }
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const connectorComplete = step.status === "complete";

        return (
          <Fragment key={step.id}>
            <li
              className={cn(
                "onboarding-stepper__item",
                step.status === "complete" && "onboarding-stepper__item--complete",
                step.status === "current" && "onboarding-stepper__item--current",
                step.status === "upcoming" && "onboarding-stepper__item--upcoming",
              )}
              aria-current={step.status === "current" ? "step" : undefined}
            >
              <StepMarker status={step.status} index={index} />
              <span className="onboarding-stepper__label">{step.label}</span>
            </li>
            {!isLast ? (
              <li
                className={cn(
                  "onboarding-stepper__connector",
                  connectorComplete && "onboarding-stepper__connector--complete",
                )}
                aria-hidden
              />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

export function getSubscribeOnboardingSteps(step: SubscribeOnboardingStep): OnboardingStep[] {
  const currentIndex = step === "plan" ? 0 : step === "confirm" ? 1 : 2;

  return [
    { id: "account", label: "Account", status: "complete" },
    {
      id: "plan",
      label: "Plan",
      status: getFlowStepStatus(0, currentIndex),
    },
    {
      id: "confirm",
      label: "Confirm",
      status: getFlowStepStatus(1, currentIndex),
    },
    {
      id: "payment",
      label: "Payment",
      status: getFlowStepStatus(2, currentIndex),
    },
  ];
}

