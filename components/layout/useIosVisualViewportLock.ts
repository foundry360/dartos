"use client";

import { useEffect } from "react";

/**
 * iPad / iOS Safari can leave a strip under position:fixed bottom bars when the
 * layout viewport and visual viewport disagree. Pin .bottom-nav / .mobile-app-root
 * to the visual viewport via --app-vv-* CSS variables.
 */
export function useIosVisualViewportLock() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const offsetLeft = vv?.offsetLeft ?? 0;
      const width = vv?.width ?? window.innerWidth;

      root.style.setProperty("--app-vv-height", `${height}px`);
      root.style.setProperty("--app-vv-offset-top", `${offsetTop}px`);
      root.style.setProperty("--app-vv-offset-left", `${offsetLeft}px`);
      root.style.setProperty("--app-vv-width", `${width}px`);
    };

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--app-vv-height");
      root.style.removeProperty("--app-vv-offset-top");
      root.style.removeProperty("--app-vv-offset-left");
      root.style.removeProperty("--app-vv-width");
    };
  }, []);
}
