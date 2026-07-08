"use client";

import { useRouter } from "next/navigation";
import { CLASSIC_GAME_SECTIONS } from "@/features/classic-games/lib/classic-games";
import {
  PracticeOptionRow,
  PracticeSetupSection,
} from "@/features/practice/components/PracticeSetupRows";

export function ClassicGamesSetupForm() {
  const router = useRouter();

  return (
    <div className="setup-screen classic-games-setup-screen">
      <div className="setup-screen__scroll">
        {CLASSIC_GAME_SECTIONS.map((section) => (
          <PracticeSetupSection key={section.title} title={section.title}>
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
