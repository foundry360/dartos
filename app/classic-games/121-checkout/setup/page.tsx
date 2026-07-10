"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { Checkout121SetupForm } from "@/features/classic-games/components/Checkout121SetupForm";
import { useCheckout121Store } from "@/features/classic-games/store/checkout-121-store";
import { prepareMatchVoiceAsync } from "@/features/voice/lib/prepare-match-voice";
import { primeCheckout121Clips } from "@/utils/checkout-121-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function Checkout121SetupPage() {
  const router = useRouter();
  const startGame = useCheckout121Store((state) => state.startGame);

  return (
    <GameSetupPage title="121 Checkout">
      <Checkout121SetupForm
        onStart={async (setup) => {
          await prepareMatchVoiceAsync(primeCheckout121Clips);
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/121-checkout/play");
        }}
      />
    </GameSetupPage>
  );
}
