"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { TicTacToeSetupForm } from "@/features/classic-games/components/TicTacToeSetupForm";
import { useTicTacToeStore } from "@/features/classic-games/store/tic-tac-toe-store";
import { prepareMatchVoice } from "@/features/voice/lib/prepare-match-voice";
import { primeTicTacToeClips } from "@/utils/tic-tac-toe-audio";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function TicTacToeSetupPage() {
  const router = useRouter();
  const startGame = useTicTacToeStore((state) => state.startGame);

  return (
    <GameSetupPage title="Tic Tac Toe">
      <TicTacToeSetupForm
        onStart={async (setup) => {
          prepareMatchVoice(primeTicTacToeClips);
          startGame(setup);
          await enterMatchFullscreen();
          router.push("/classic-games/tic-tac-toe/play");
        }}
      />
    </GameSetupPage>
  );
}
