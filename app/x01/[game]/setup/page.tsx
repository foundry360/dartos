"use client";

import { useParams, useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { PlayerSetupForm } from "@/features/players/components/PlayerSetupForm";
import { parseX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function X01SetupPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const startGame = useX01Store((state) => state.startGame);
  const gameParam = params.game;

  const gameType = parseX01GameType(gameParam);

  if (!gameType) {
    return (
      <GameSetupPage title="Invalid game">
        <p className="text-center text-sm text-muted-foreground">
          Choose 301, 501, or 701 from the home screen.
        </p>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title={String(gameType)}>
      <PlayerSetupForm
        onStart={async (playerNames) => {
          startGame(gameType, playerNames);
          await enterMatchFullscreen();
          router.push(`/x01/${gameType}/play`);
        }}
      />
    </GameSetupPage>
  );
}
