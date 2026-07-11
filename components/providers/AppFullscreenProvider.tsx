"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isPublicPath } from "@/lib/auth/routes";
import {
  initAppFullscreenOnLaunch,
  maintainAppFullscreen,
  restoreFullscreenAfterNavigation,
} from "@/utils/fullscreen";

export function AppFullscreenProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = isPublicPath(pathname);

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
