"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotHalveItSetupForm } from "@/features/bot/components/BotHalveItSetupForm";
import { useHalveItStore } from "@/features/classic-games/store/halve-it-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function BotHalveItSetupPage() {
  const router = useRouter();
  const startGame = useHalveItStore((state) => state.startGame);

  return (
    <GameSetupPage title="Halve-It vs Bot">
      <BotHalveItSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/halve-it/play");
        }}
      />
    </GameSetupPage>
  );
}
