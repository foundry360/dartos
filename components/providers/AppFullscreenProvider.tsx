"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIosVisualViewportLock } from "@/components/layout/useIosVisualViewportLock";
import { isPublicPath } from "@/lib/auth/routes";
import {
  initAppFullscreenOnLaunch,
  maintainAppFullscreen,
  restoreFullscreenAfterNavigation,
} from "@/utils/fullscreen";
import { installGlobalAudioUnlock } from "@/utils/voice-playback";

export function AppFullscreenProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = isPublicPath(pathname);

  useIosVisualViewportLock();

  useEffect(() => {
    installGlobalAudioUnlock();
  }, []);

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    initAppFullscreenOnLaunch();
    return maintainAppFullscreen();
  }, [isPublicRoute]);

  useEffect(() => {
    if (isPublicRoute) {
      return;
    }

    restoreFullscreenAfterNavigation();
  }, [pathname, isPublicRoute]);

  return children;
}
