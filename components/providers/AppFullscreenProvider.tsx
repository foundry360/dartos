"use client";

import { useEffect } from "react";
import { requestAppFullscreen, shouldUseFullscreenAPI } from "@/utils/fullscreen";

export function AppFullscreenProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!shouldUseFullscreenAPI()) {
      return;
    }

    let cancelled = false;

    const retryOnGesture = () => {
      if (cancelled || document.fullscreenElement) {
        return;
      }

      void requestAppFullscreen();
    };

    async function enterFullscreen() {
      const entered = await requestAppFullscreen();

      if (cancelled || entered || document.fullscreenElement) {
        return;
      }

      window.addEventListener("pointerdown", retryOnGesture, { once: true });
      window.addEventListener("keydown", retryOnGesture, { once: true });
    }

    void enterFullscreen();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", retryOnGesture);
      window.removeEventListener("keydown", retryOnGesture);
    };
  }, []);

  return children;
}
