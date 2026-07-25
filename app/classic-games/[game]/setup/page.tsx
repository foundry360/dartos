"use client";

import { useParams } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { CLASSIC_GAMES_HUB_PATH, getClassicGame } from "@/features/classic-games/lib/classic-games";
import type { HowToPlayId } from "@/features/help/lib/how-to-play";

const CLASSIC_HOW_TO_PLAY: Record<string, HowToPlayId> = {
  "121-checkout": "checkout-121",
  "bobs-27": "bobs-27",
  shanghai: "shanghai",
  "halve-it": "halve-it",
  killer: "killer",
  baseball: "baseball",
  golf: "golf",
  "tic-tac-toe": "tic-tac-toe",
};

export default function ClassicGameSetupPage() {
  const params = useParams<{ game: string }>();
  const game = getClassicGame(params.game);
  const howToPlay = CLASSIC_HOW_TO_PLAY[params.game];

  if (!game) {
    return (
      <GameSetupPage title="Classic Formats">
        <div className="setup-screen">
          <SettingsGroup title="Classic Formats" backHref={CLASSIC_GAMES_HUB_PATH}>
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Choose a format from the Classic Formats list.
            </p>
          </SettingsGroup>
        </div>
      </GameSetupPage>
    );
  }

  return (
    <GameSetupPage title={game.label}>
      <div className="setup-screen">
        <div className="setup-screen__scroll">
          <SettingsGroup
            title={game.label}
            howToPlay={howToPlay}
            backHref={CLASSIC_GAMES_HUB_PATH}
          >
            <p className="px-4 py-3 text-sm text-muted-foreground">Setup coming soon.</p>
          </SettingsGroup>
        </div>
      </div>
    </GameSetupPage>
  );
}
