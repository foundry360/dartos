"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { Bobs27SetupForm } from "@/features/classic-games/components/Bobs27SetupForm";
import { useBobs27Store } from "@/features/classic-games/store/bobs-27-store";
import { prepareMatchVoiceAsync } from "@/features/voice/lib/prepare-match-voice";
import { primeBobs27Clips } from "@/utils/bobs-27-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function Bobs27SetupPage() {
  const router = useRouter();
  const startGame = useBobs27Store((state) => state.startGame);

  return (
    <GameSetupPage title="Bob's 27">
      <Bobs27SetupForm
        onStart={async (setup) => {
          await prepareMatchVoiceAsync(primeBobs27Clips);
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/bobs-27/play");
        }}
      />
    </GameSetupPage>
  );
}
