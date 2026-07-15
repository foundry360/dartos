"use client";

import { useRouter } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { PracticeSetupForm } from "@/features/practice/components/PracticeSetupForm";
import { PracticeStatsHeaderButton } from "@/features/practice/components/PracticeStatsHeaderButton";
import { usePracticeStore } from "@/features/practice/store/practice-store";
import { enterMatchFullscreen } from "@/utils/fullscreen";
import {
  announcePracticeGameOnFromGesture,
  buildPracticeGameOnAnnounceKey,
  resolvePracticeGameOnTitle,
  resetPracticeGameOnAnnounceTracking,
} from "@/utils/practice-game-on-audio";
import { unlockVoicePlayback } from "@/utils/voice-playback";

export default function PracticeSetupPage() {
  const router = useRouter();
  const startSession = usePracticeStore((state) => state.startSession);

  return (
    <GameSetupPage title="Practice" headerContent={<PracticeStatsHeaderButton />}>
      <PracticeSetupForm
        onStart={(setup) => {
          resetPracticeGameOnAnnounceTracking();
          const unlockPromise = unlockVoicePlayback();
          startSession(setup);

          const session = usePracticeStore.getState().session;
          const title =
            session != null
              ? resolvePracticeGameOnTitle(session.setup, session.activeGame, {
                  remainingSeconds: session.remainingSeconds,
                  randomCheckoutConfig: session.randomCheckoutConfig,
                })
              : null;

          void (async () => {
            const unlocked = await unlockPromise;
            if (unlocked && session && title) {
              await announcePracticeGameOnFromGesture(
                buildPracticeGameOnAnnounceKey(session.startedAt, session.activeGame, title),
                title,
              );
            }

            await enterMatchFullscreen();
            router.push("/practice/play");
          })();
        }}
      />
    </GameSetupPage>
  );
}
