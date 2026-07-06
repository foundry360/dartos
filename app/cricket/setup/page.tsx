"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { CricketSetupForm } from "@/features/cricket/components/CricketSetupForm";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function CricketSetupPage() {
  const router = useRouter();
  const startGame = useCricketStore((state) => state.startGame);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);

  return (
    <GameSetupPage title="Cricket/Tactics">
      <CricketSetupForm
        legsToWin={legsToWin}
        setsToWin={setsToWin}
        onLegsChange={setLegsToWin}
        onSetsChange={setSetsToWin}
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/cricket/play");
        }}
      />
    </GameSetupPage>
  );
}
