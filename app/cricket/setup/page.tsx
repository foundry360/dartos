"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { PlayerSetupForm } from "@/features/players/components/PlayerSetupForm";
import { MatchFormatPicker } from "@/features/players/components/MatchFormatPicker";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { startMatchFullscreen } from "@/utils/fullscreen";

export default function CricketSetupPage() {
  const router = useRouter();
  const startGame = useCricketStore((state) => state.startGame);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);

  return (
    <GameSetupPage title="Cricket" splitLayout>
      <MatchFormatPicker
        legsToWin={legsToWin}
        setsToWin={setsToWin}
        onLegsChange={setLegsToWin}
        onSetsChange={setSetsToWin}
      />
      <PlayerSetupForm
        onStart={(playerNames) => {
          startGame(playerNames, { legsToWin, setsToWin });
          startMatchFullscreen();
          router.push("/cricket/play");
        }}
      />
    </GameSetupPage>
  );
}
