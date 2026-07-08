"use client";

import { useParams } from "next/navigation";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { CLASSIC_GAMES_HUB_PATH, getClassicGame } from "@/features/classic-games/lib/classic-games";

export default function ClassicGameSetupPage() {
  const params = useParams<{ game: string }>();
  const game = getClassicGame(params.game);

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
        <SettingsGroup title={game.label} backHref={CLASSIC_GAMES_HUB_PATH}>
          <p className="px-4 py-3 text-sm text-muted-foreground">Setup coming soon.</p>
        </SettingsGroup>
      </div>
    </GameSetupPage>
  );
}
