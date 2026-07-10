"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotX01SetupForm } from "@/features/bot/components/BotX01SetupForm";
import { parseX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

function BotX01SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startGame = useX01Store((state) => state.startGame);
  const gameParam = searchParams.get("game") ?? "501";
  const gameType = parseX01GameType(gameParam) ?? 501;

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

export default function BotX01SetupPage() {
  return (
    <Suspense fallback={null}>
      <BotX01SetupPageContent />
    </Suspense>
  );
}
