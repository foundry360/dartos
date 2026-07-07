"use client";

import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { MatchPlaySetupForm } from "@/features/match-play/components/MatchPlaySetupForm";

export default function MatchPlaySetupPage() {
  return (
    <GameSetupPage title="Match Play">
      <MatchPlaySetupForm />
    </GameSetupPage>
  );
}
