"use client";

import { useRouter } from "next/navigation";
import { MATCH_PLAY_GAME_SECTIONS } from "@/features/match-play/lib/match-play-games";
import {
  PracticeOptionRow,
  PracticeSetupSection,
} from "@/features/practice/components/PracticeSetupRows";

export function MatchPlaySetupForm() {
  const router = useRouter();

  return (
    <div className="setup-screen match-play-setup-screen">
      <div className="setup-screen__scroll">
        {MATCH_PLAY_GAME_SECTIONS.map((section) => (
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
