"use client";

import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { BotPlaySetupForm } from "@/features/bot/components/BotPlaySetupForm";

export default function BotSetupPage() {
  return (
    <GameSetupPage title="Play the Bot">
      <BotPlaySetupForm />
    </GameSetupPage>
  );
}
