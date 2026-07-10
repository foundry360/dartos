"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotBobs27SetupForm } from "@/features/bot/components/BotBobs27SetupForm";
import { useBobs27Store } from "@/features/classic-games/store/bobs-27-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function BotBobs27SetupPage() {
  const router = useRouter();
  const startGame = useBobs27Store((state) => state.startGame);

  return (
    <GameSetupPage title="Bob's 27 vs Bot">
      <BotBobs27SetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/bobs-27/play");
        }}
      />
    </GameSetupPage>
  );
}
