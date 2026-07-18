"use client";

import { useEffect } from "react";

function clearAppViewportVars(root: HTMLElement) {
  root.style.removeProperty("--app-vv-height");
  root.style.removeProperty("--app-vv-offset-top");
  root.style.removeProperty("--app-vv-offset-left");
  root.style.removeProperty("--app-vv-width");
}

function isEditingTextField() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return false;
  }
  const tag = active.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    active.isContentEditable
  );
}

/**
 * iPad / iOS Safari can leave a strip under position:fixed bottom bars when the
 * layout viewport and visual viewport disagree. Pin .bottom-nav / .mobile-app-root
 * to the visual viewport via --app-vv-* CSS variables.
 *
 * Disabled on auth/public routes so a login keyboard cannot leave a shrunk
 * viewport that collapses the app shell after sign-in.
 */
export function useIosVisualViewportLock(enabled: boolean, pathname: string) {
  useEffect(() => {
    const root = document.documentElement;

    if (!enabled) {
      clearAppViewportVars(root);
      return;
    }

    const sync = () => {
      const vv = window.visualViewport;
      const editing = isEditingTextField();

      // Only track the visual viewport while a field is focused (keyboard open).
      // Otherwise use the layout viewport so a dismissed keyboard never leaves
      // .mobile-app-root stuck at a short height after login.
      if (!editing) {
        root.style.setProperty("--app-vv-height", `${window.innerHeight}px`);
        root.style.setProperty("--app-vv-width", `${window.innerWidth}px`);
        root.style.setProperty("--app-vv-offset-top", "0px");
        root.style.setProperty("--app-vv-offset-left", "0px");
        return;
      }

      root.style.setProperty("--app-vv-height", `${vv?.height ?? window.innerHeight}px`);
      root.style.setProperty("--app-vv-width", `${vv?.width ?? window.innerWidth}px`);
      root.style.setProperty("--app-vv-offset-top", `${vv?.offsetTop ?? 0}px`);
      root.style.setProperty("--app-vv-offset-left", `${vv?.offsetLeft ?? 0}px`);
    };

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("focusin", sync);
    window.addEventListener("focusout", sync);

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("focusin", sync);
      window.removeEventListener("focusout", sync);
      clearAppViewportVars(root);
    };
  }, [enabled, pathname]);
}
