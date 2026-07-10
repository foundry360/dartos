"use client";

import { useRouter } from "next/navigation";
import { BOT_PLAY_GAME_SECTIONS } from "@/features/bot/lib/bot-play-games";
import {
  PracticeOptionRow,
  PracticeSetupSection,
} from "@/features/practice/components/PracticeSetupRows";

export function BotPlaySetupForm() {
  const router = useRouter();

  return (
    <div className="setup-screen bot-play-setup-screen">
      <div className="setup-screen__scroll">
        {BOT_PLAY_GAME_SECTIONS.map((section) => (
          <PracticeSetupSection key={section.id} title={section.title}>
            {section.games.map((game) => (
              <PracticeOptionRow
                key={game.id}
                label={game.label}
                onPress={() => router.push(game.href)}
              />
            ))}
          </PracticeSetupSection>
        ))}
      </div>
    </div>
  );
}
