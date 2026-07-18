"use client";

import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 4200;
const MAX_WAIT_MS = 6000;
const EXIT_MS = 750;

/**
 * Boot splash owned by React (SSR + client). Dismiss via state only —
 * never imperative DOM remove(), which causes insertBefore hydration crashes.
 *
 * Logo pan uses a two-phase class toggle (ready → enter) so iPad PWA gets a
 * real CSS transition; keyframe "from" states are often skipped on cold start.
 */
export function AppBootSplash() {
  const [phase, setPhase] = useState<"show" | "exit" | "gone">("show");
  const [logoReady, setLogoReady] = useState(false);
  const [logoEnter, setLogoEnter] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setLogoReady(true);
      setLogoEnter(true);
      return;
    }

    let cancelled = false;
    let startTimer = 0;

    // Wait a paint + short delay so standalone PWA has styles composited
    // before enabling transitions (avoids snapping to the end state).
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        setLogoReady(true);
        // Force layout so the "from" styles are committed before "enter".
        void logoRef.current?.offsetWidth;
        startTimer = window.setTimeout(() => {
          if (!cancelled) {
            setLogoEnter(true);
          }
        }, 48);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(startTimer);
    };
  }, []);

  useEffect(() => {
    const started = performance.now();
    let finished = false;
    let maxTimer = 0;
    let hideTimer = 0;
    let goneTimer = 0;

    const clearBootBackground = () => {
      document.documentElement.classList.remove("app-booting");
      document.documentElement.classList.add("app-boot-ready");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;

      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimer = window.setTimeout(() => {
        clearBootBackground();
        setPhase("exit");
        goneTimer = window.setTimeout(() => {
          setPhase("gone");
        }, EXIT_MS);
      }, wait);
    };

    const onReady = () => {
      window.clearTimeout(maxTimer);
      finish();
    };

    const ready = async () => {
      try {
        if (document.fonts?.ready) {
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => window.setTimeout(resolve, 600)),
          ]);
        }
      } catch {
        // ignore
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(onReady);
      });
    };

    maxTimer = window.setTimeout(onReady, MAX_WAIT_MS);

    if (document.readyState === "complete") {
      void ready();
    } else {
      window.addEventListener("load", () => void ready(), { once: true });
      void ready();
    }

    return () => {
      window.clearTimeout(maxTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") {
    return null;
  }

  const logoClass = [
    "app-boot-splash__logo-wrap",
    logoReady ? "app-boot-splash__logo-wrap--ready" : "",
    logoEnter ? "app-boot-splash__logo-wrap--enter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id="app-boot-splash"
      className={
        phase === "exit" ? "app-boot-splash app-boot-splash--exit" : "app-boot-splash"
      }
      aria-hidden="true"
    >
      <div className="app-boot-splash__board">
        <div className="app-boot-splash__board-spin" />
      </div>
      <div className="app-boot-splash__glow" />
      <div ref={logoRef} className={logoClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="app-boot-splash__logo"
          src="/vectoros-splash-logo.png"
          alt="VectorOS"
          width={693}
          height={360}
          decoding="sync"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}
