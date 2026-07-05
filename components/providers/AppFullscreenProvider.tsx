"use client";

import { useEffect } from "react";
import { initAppFullscreenOnLaunch } from "@/utils/fullscreen";

export function AppFullscreenProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return initAppFullscreenOnLaunch();
  }, []);

  return children;
}
