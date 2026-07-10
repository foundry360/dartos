"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { X01SetupForm } from "@/features/x01/components/X01SetupForm";
import { useX01Store } from "@/features/x01/store/x01-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function X01SetupPage() {
  const router = useRouter();
  const startGame = useX01Store((state) => state.startGame);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);

  return (
    <GameSetupPage title="X01">
      <X01SetupForm
        legsToWin={legsToWin}
        setsToWin={setsToWin}
        onLegsChange={setLegsToWin}
        onSetsChange={setSetsToWin}
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push(`/x01/${setup.gameType}/play`);
        }}
      />
    </GameSetupPage>
  );
}
