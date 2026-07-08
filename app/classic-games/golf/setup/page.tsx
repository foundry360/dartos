"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { GolfSetupForm } from "@/features/classic-games/components/GolfSetupForm";
import { useGolfStore } from "@/features/classic-games/store/golf-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function GolfSetupPage() {
  const router = useRouter();
  const startGame = useGolfStore((state) => state.startGame);

  return (
    <GameSetupPage title="Golf">
      <GolfSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/golf/play");
        }}
      />
    </GameSetupPage>
  );
}
