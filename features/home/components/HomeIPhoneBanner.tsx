"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLAYER_DISCOVER_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

const SLIDE_COUNT = 2;
const CYCLE_MS = 4800;

/** iPhone home only — banner art + Ready to play? card, auto-cycling. */
export function HomeIPhoneBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDE_COUNT);
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [paused]);

  const goTo = (next: number) => {
    setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  };

  return (
    <section
      className="home-iphone-banner home-iphone-banner--carousel"
      aria-roledescription="carousel"
      aria-label="Home highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        setPaused(false);

        if (startX == null || endX == null) {
          return;
        }

        const delta = endX - startX;
        if (Math.abs(delta) < 40) {
          return;
        }

        goTo(index + (delta < 0 ? 1 : -1));
      }}
    >
      <div className="home-iphone-banner__viewport">
        <AnimatePresence mode="wait" initial={false}>
          {index === 0 ? (
            <motion.div
              key="banner"
              className="home-iphone-banner__slide"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={PLAYER_DISCOVER_PATH}
                className="home-iphone-banner__cta-link"
                aria-label="Discover leagues"
              >
                <Image
                  src="/player/account-banner.png"
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="home-iphone-banner__image"
                />
                <div className="home-iphone-banner__fade" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              className="home-iphone-banner__slide home-iphone-banner__slide--ready"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="home-iphone-banner__ready" aria-live="polite">
                <p className="home-iphone-banner__ready-eyebrow">Match night</p>
                <h2 className="home-iphone-banner__ready-title">Ready to play?</h2>
                <p className="home-iphone-banner__ready-copy">
                  Pick a format and get on the board.
                </p>
                <Link href="/play/setup" className="home-iphone-banner__ready-cta">
                  Start a match
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="home-iphone-banner__dots" role="tablist" aria-label="Banner slides">
        {Array.from({ length: SLIDE_COUNT }, (_, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            role="tab"
            aria-selected={index === slideIndex}
            aria-label={slideIndex === 0 ? "Discover leagues" : "Ready to play"}
            className={cn(
              "home-iphone-banner__dot",
              index === slideIndex && "home-iphone-banner__dot--active",
            )}
            onClick={() => goTo(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
}
