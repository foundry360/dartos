"use client";

import { useEffect, useState } from "react";
import "./app-boot-splash.css";

const MIN_VISIBLE_MS = 4200;
const MAX_WAIT_MS = 6000;
const EXIT_MS = 750;

/**
 * Boot splash owned by React (SSR + client). Dismiss via state only —
 * never imperative DOM remove(), which causes insertBefore hydration crashes.
 */
export function AppBootSplash() {
  const [phase, setPhase] = useState<"show" | "exit" | "gone">("show");
  const [logoEnter, setLogoEnter] = useState(false);

  useEffect(() => {
    // Start the pan after paint so the browser doesn't skip the "from" keyframe.
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setLogoEnter(true);
      });
    });

    return () => window.cancelAnimationFrame(frame);
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

  return (
    <div
      id="app-boot-splash"
      className={
        phase === "exit" ? "app-boot-splash app-boot-splash--exit" : "app-boot-splash"
      }
      aria-hidden="true"
    >
      <div className="app-boot-splash__board" />
      <div className="app-boot-splash__glow" />
      <div
        className={
          logoEnter
            ? "app-boot-splash__logo-wrap app-boot-splash__logo-wrap--enter"
            : "app-boot-splash__logo-wrap"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="app-boot-splash__logo"
          src="/vectoros-splash-logo.png"
          alt="VectorOS"
          width={693}
          height={360}
          decoding="async"
        />
      </div>
    </div>
  );
}
