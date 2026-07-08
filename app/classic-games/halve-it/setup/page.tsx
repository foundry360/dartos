"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { HalveItSetupForm } from "@/features/classic-games/components/HalveItSetupForm";
import { useHalveItStore } from "@/features/classic-games/store/halve-it-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function HalveItSetupPage() {
  const router = useRouter();
  const startGame = useHalveItStore((state) => state.startGame);

  return (
    <GameSetupPage title="Halve-It">
      <HalveItSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/halve-it/play");
        }}
      />
    </GameSetupPage>
  );
}
