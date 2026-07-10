"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CricketVariant } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotCricketSetupForm } from "@/features/bot/components/BotCricketSetupForm";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

function parseCricketVariant(value: string | null): CricketVariant {
  return value === "tactics" ? "tactics" : "classic";
}

function BotCricketSetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startGame = useCricketStore((state) => state.startGame);
  const variant = parseCricketVariant(searchParams.get("variant"));

  return (
    <GameSetupPage title="Cricket vs Bot">
      <BotCricketSetupForm
        initialVariant={variant}
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/cricket/play");
        }}
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
