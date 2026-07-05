"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerSetupForm } from "@/features/players/components/PlayerSetupForm";
import { parseX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";

export default function X01SetupPage() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const startGame = useX01Store((state) => state.startGame);
  const gameParam = params.game;

  const gameType = parseX01GameType(gameParam);

  if (!gameType) {
    return (
      <AppShell className="px-4 pb-safe-bottom">
        <PageHeader title="Invalid game" backHref="/" />
        <p className="px-4 text-muted-foreground">Choose 301, 501, or 701 from the home screen.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={`${gameType}`} subtitle="Setup your match" backHref="/" />
      <PlayerSetupForm
        title={`${gameType} Match`}
        onStart={(playerNames) => {
          startGame(gameType, playerNames);
          router.push(`/x01/${gameType}/play`);
        }}
      />
    </AppShell>
  );
}
