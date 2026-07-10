"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CricketVariant } from "@/lib/constants";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { CricketSetupForm } from "@/features/cricket/components/CricketSetupForm";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { prepareMatchVoiceAsync } from "@/features/voice/lib/prepare-match-voice";
import { primeCricketClosedClips } from "@/utils/cricket-closed-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

function parseCricketVariant(value: string | null): CricketVariant {
  return value === "tactics" ? "tactics" : "classic";
}

function CricketSetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startGame = useCricketStore((state) => state.startGame);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);
  const variant = parseCricketVariant(searchParams.get("variant"));
  const title = variant === "tactics" ? "Tactics" : "Cricket";

  return (
    <GameSetupPage title={title}>
      <CricketSetupForm
        initialVariant={variant}
        legsToWin={legsToWin}
        setsToWin={setsToWin}
        onLegsChange={setLegsToWin}
        onSetsChange={setSetsToWin}
        onStart={async (setup) => {
          await prepareMatchVoiceAsync(() => primeCricketClosedClips(variant));
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/cricket/play");
        }}
      />
    </GameSetupPage>
  );
}

export default function CricketSetupPage() {
  return (
    <Suspense fallback={<GameSetupPage title="Cricket" />}>
      <CricketSetupPageContent />
    </Suspense>
  );
}
