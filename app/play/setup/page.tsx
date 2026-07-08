"use client";

import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { ClassicGamesSetupForm } from "@/features/classic-games/components/ClassicGamesSetupForm";

export default function ClassicGamesHubPage() {
  return (
    <GameSetupPage title="Classic Formats">
      <ClassicGamesSetupForm />
    </GameSetupPage>
  );
}
