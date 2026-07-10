"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { KillerSetupForm } from "@/features/classic-games/components/KillerSetupForm";
import { useKillerStore } from "@/features/classic-games/store/killer-store";
import { prepareMatchVoice } from "@/features/voice/lib/prepare-match-voice";
import { primeKillerClips } from "@/utils/killer-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function KillerSetupPage() {
  const router = useRouter();
  const startGame = useKillerStore((state) => state.startGame);

  return (
    <GameSetupPage title="Killer">
      <KillerSetupForm
        onStart={async (setup) => {
          prepareMatchVoice(primeKillerClips);
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/killer/play");
        }}
      />
    </GameSetupPage>
  );
}
