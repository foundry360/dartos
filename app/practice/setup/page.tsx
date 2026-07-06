"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { PracticeSetupForm } from "@/features/practice/components/PracticeSetupForm";
import { usePracticeStore } from "@/features/practice/store/practice-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";

export default function PracticeSetupPage() {
  const router = useRouter();
  const startSession = usePracticeStore((state) => state.startSession);

  return (
    <GameSetupPage title="Practice">
      <PracticeSetupForm
        onStart={async (setup) => {
          startSession(setup);
          await enterMatchFullscreen();
          router.push("/practice/play");
        }}
      />
    </GameSetupPage>
  );
}
