"use client";

import { useEffect } from "react";
import { fulfillMatchFullscreenIntent } from "@/utils/fullscreen";

export function useMatchFullscreen(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    return fulfillMatchFullscreenIntent();
  }, [active]);
}
