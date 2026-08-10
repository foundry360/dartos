"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlayerUpgradeModal } from "@/features/player-access/components/PlayerUpgradeModal";
import { getUpgradeModalPreviewVariant } from "@/lib/dev/upgrade-modal-preview";

function UpgradeModalPreviewContent() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("variant") === "free" ? "free" : "trial";
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const variant = getUpgradeModalPreviewVariant(requested === "free" ? "free" : "1");
    setAllowed(variant != null);
    setReady(true);

    if (!variant) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("preview_upgrade", variant === "free" ? "free" : "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [requested]);

  if (!ready) {
    return <p style={{ padding: 24 }}>Loading preview…</p>;
  }

  if (!allowed) {
    return (
      <p style={{ padding: 24 }}>
        Upgrade modal preview is only available in local development or non-production Vercel
        deployments.
      </p>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0E1210", padding: 24, color: "#F3EEE3" }}>
      <p style={{ marginBottom: 12, opacity: 0.7 }}>
        Upgrade modal preview ({requested}). Close it or use Not now to dismiss.
      </p>
      <PlayerUpgradeModal variant={requested} />
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
