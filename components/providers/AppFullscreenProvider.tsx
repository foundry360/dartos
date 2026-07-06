"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  initAppFullscreenOnLaunch,
  maintainAppFullscreen,
  restoreFullscreenAfterNavigation,
} from "@/utils/fullscreen";

export function AppFullscreenProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initAppFullscreenOnLaunch();
    return maintainAppFullscreen();
  }, []);

  useEffect(() => {
    restoreFullscreenAfterNavigation();
  }, [pathname]);

  return children;
}
