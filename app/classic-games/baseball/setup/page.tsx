"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BaseballSetupForm } from "@/features/classic-games/components/BaseballSetupForm";
import { useBaseballStore } from "@/features/classic-games/store/baseball-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function BaseballSetupPage() {
  const router = useRouter();
  const startGame = useBaseballStore((state) => state.startGame);

  return (
    <GameSetupPage title="Baseball">
      <BaseballSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/baseball/play");
        }}
      />
    </GameSetupPage>
  );
}
