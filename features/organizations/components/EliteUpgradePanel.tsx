"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { buildSubscribePath } from "@/features/onboarding/lib/onboarding-path";
import { getSubscriptionPlan } from "@/features/onboarding/lib/subscription-plans";

interface EliteUpgradePanelProps {
  title?: string;
  description?: string;
}

/** Upgrade gate for league management (venues / admin). Targets League Pro. */
export function EliteUpgradePanel({
  title = "League Pro required",
  description = "League management and venues are included with the League Pro plan.",
}: EliteUpgradePanelProps) {
  const leaguePro = getSubscriptionPlan("league_pro");

  return (
    <GlassPanel className="organization-elite-gate space-y-4">
      <div>
        <h2 className="settings-panel__subheading text-2xl font-bold">{title}</h2>
        <p className="settings-panel__subdescription">{description}</p>
      </div>

      <ul className="organization-elite-gate__features">
        {leaguePro.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <Link href={buildSubscribePath("league_pro")} className="block">
        <TouchButton fullWidth size="lg">
          Upgrade to League Pro
        </TouchButton>
      </Link>
    </GlassPanel>
  );
}
