"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

/**
 * Sends GA4 page_view on App Router client navigations.
 * Skips the first mount — gtag('config') already records the initial load.
 */
export function GoogleAnalyticsRouteTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    sendGAEvent("event", "page_view", {
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      send_to: gaId,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}
