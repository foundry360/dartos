"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotShanghaiSetupForm } from "@/features/bot/components/BotShanghaiSetupForm";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function BotShanghaiSetupPage() {
  const router = useRouter();
  const startGame = useShanghaiStore((state) => state.startGame);

  return (
    <GameSetupPage title="Shanghai vs Bot">
      <BotShanghaiSetupForm
        onStart={async (setup) => {
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/shanghai/play");
        }}
      />
    </GameSetupPage>
  );
}
