"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotX01SetupForm } from "@/features/bot/components/BotX01SetupForm";
import { parseX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

function BotX01GameSetupPageContent() {
  const router = useRouter();
  const params = useParams<{ game: string }>();
  const startGame = useX01Store((state) => state.startGame);
  const gameType = parseX01GameType(params.game);

  if (!gameType) {
    return (
      <GameSetupPage title="Invalid match">
        <p className="text-center text-sm text-muted-foreground">
          Choose 201, 301, 501, or 701 from the bot X01 setup screen.
        </p>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title="X01 vs Bot">
      <BotX01SetupForm
        initialGameType={gameType}
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push(`/x01/${setup.gameType}/play`);
        }}
      />
    </GameSetupPage>
  );
}

export default function BotX01GameSetupPage() {
  return (
    <Suspense fallback={null}>
      <BotX01GameSetupPageContent />
    </Suspense>
  );
}
