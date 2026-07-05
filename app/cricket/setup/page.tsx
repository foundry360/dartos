"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerSetupForm } from "@/features/players/components/PlayerSetupForm";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { startMatchFullscreen } from "@/utils/fullscreen";

export default function CricketSetupPage() {
  const router = useRouter();
  const startGame = useCricketStore((state) => state.startGame);

  return (
    <AppShell>
      <PageHeader title="Cricket" subtitle="Setup your match" backHref="/" />
      <PlayerSetupForm
        title="Cricket Match"
        onStart={(playerNames) => {
          startGame(playerNames);
          startMatchFullscreen();
          router.push("/cricket/play");
        }}
      />
    </AppShell>
  );
}
