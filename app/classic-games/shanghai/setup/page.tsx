"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { ShanghaiSetupForm } from "@/features/classic-games/components/ShanghaiSetupForm";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function ShanghaiSetupPage() {
  const router = useRouter();
  const startGame = useShanghaiStore((state) => state.startGame);

  return (
    <GameSetupPage title="Shanghai">
      <ShanghaiSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/shanghai/play");
        }}
      />
    </GameSetupPage>
  );
}
