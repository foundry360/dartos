"use client";

import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { MobileAppShell } from "@/components/layout/MobileAppShell";

export default function DevMatchCompletePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <MobileAppShell className="pb-safe-bottom">
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Match screen behind modal</p>
      </div>
      <MatchCompletePanel
        open
        winnerName="Player 1"
        onHome={() => {}}
        onRematch={() => {}}
      />
    </MobileAppShell>
  );
}
