"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { ShanghaiSetupForm } from "@/features/classic-games/components/ShanghaiSetupForm";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { prepareMatchVoice } from "@/features/voice/lib/prepare-match-voice";
import { primeShanghaiClips } from "@/utils/shanghai-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function ShanghaiSetupPage() {
  const router = useRouter();
  const startGame = useShanghaiStore((state) => state.startGame);

  return (
    <GameSetupPage title="Shanghai">
      <ShanghaiSetupForm
        onStart={async (setup) => {
          prepareMatchVoice(primeShanghaiClips);
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/shanghai/play");
        }}
      />
    </GameSetupPage>
  );
}
