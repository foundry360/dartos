"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PlayerUpgradeModal } from "@/features/player-access/components/PlayerUpgradeModal";
import { getUpgradeModalPreviewVariant } from "@/lib/dev/upgrade-modal-preview";

function UpgradeModalPreviewContent() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("variant") === "free" ? "free" : "trial";
  const allowed = useMemo(
    () => getUpgradeModalPreviewVariant(requested === "free" ? "free" : "1") != null,
    [requested],
  );

  if (!allowed) {
    return (
      <p style={{ padding: 24 }}>
        Upgrade modal preview is only available in local development or non-production Vercel
        deployments.
      </p>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0E1210" }}>
      <PlayerUpgradeModal variant={requested} preview />
    </div>
  );
}

export default function UpgradeModalPreviewPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading preview…</p>}>
      <UpgradeModalPreviewContent />
    </Suspense>
  );
}
