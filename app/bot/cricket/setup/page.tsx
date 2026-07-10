"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCricketVariantLabel, type CricketVariant } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotGameSetupPlaceholder } from "@/features/bot/components/BotGameSetupPlaceholder";

function parseCricketVariant(value: string | null): CricketVariant {
  return value === "tactics" ? "tactics" : "classic";
}

function BotCricketSetupPageContent() {
  const searchParams = useSearchParams();
  const variant = parseCricketVariant(searchParams.get("variant"));
  const title = formatCricketVariantLabel(variant);

  return (
    <GameSetupPage title={`${title} vs Bot`}>
      <BotGameSetupPlaceholder
        title={title}
        description="Choose a difficulty level and start a match against a simulated opponent."
      />
    </GameSetupPage>
  );
}

export default function BotCricketSetupPage() {
  return (
    <Suspense fallback={null}>
      <BotCricketSetupPageContent />
    </Suspense>
  );
}
