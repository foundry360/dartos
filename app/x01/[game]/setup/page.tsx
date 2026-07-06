"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DEFAULT_LEGS, DEFAULT_SETS } from "@/lib/constants";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { X01SetupForm } from "@/features/x01/components/X01SetupForm";
import { parseX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function X01SetupPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const startGame = useX01Store((state) => state.startGame);
  const [legsToWin, setLegsToWin] = useState(DEFAULT_LEGS);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_SETS);
  const gameParam = params.game;

  const gameType = parseX01GameType(gameParam);

  if (!gameType) {
    return (
      <GameSetupPage title="Invalid match">
        <p className="text-center text-sm text-muted-foreground">
          Choose 301, 501, or 701 from the home screen.
        </p>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title={String(gameType)}>
      <X01SetupForm
        gameType={gameType}
        legsToWin={legsToWin}
        setsToWin={setsToWin}
        onLegsChange={setLegsToWin}
        onSetsChange={setSetsToWin}
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push(`/x01/${gameType}/play`);
        }}
      />
    </GameSetupPage>
  );
}
