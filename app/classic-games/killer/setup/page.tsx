"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { KillerSetupForm } from "@/features/classic-games/components/KillerSetupForm";
import { useKillerStore } from "@/features/classic-games/store/killer-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function KillerSetupPage() {
  const router = useRouter();
  const startGame = useKillerStore((state) => state.startGame);

  return (
    <GameSetupPage title="Killer">
      <KillerSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/killer/play");
        }}
      />
    </GameSetupPage>
  );
}
