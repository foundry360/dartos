"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HomeClassicsPromoCard } from "@/features/home/components/HomeClassicsPromoCard";
import { HomeLeaguePromoCard } from "@/features/home/components/HomeLeaguePromoCard";
import { cn } from "@/utils/cn";

const SLIDE_COUNT = 2;
const CYCLE_MS = 4800;

/**
 * iPad/desktop home: one promo card in the Active Match slot that rotates
 * between League Discover and Classics.
 */
export function HomeDesktopPromoRow() {
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
      className="home-promo-row home-promo-row--carousel"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
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
      <div className="home-promo-row__viewport">
        <AnimatePresence mode="wait" initial={false}>
          {index === 0 ? (
            <motion.div
              key="league"
              className="home-promo-row__slide"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <HomeLeaguePromoCard
                className="home-classics-promo--slot"
                titleId="home-desktop-league-promo-title"
                priorityImage
              />
            </motion.div>
          ) : (
            <motion.div
              key="classics"
              className="home-promo-row__slide"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <HomeClassicsPromoCard
                className="home-classics-promo--slot"
                titleId="home-desktop-classics-promo-title"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="home-promo-row__dots" role="tablist" aria-label="Promo slides">
        {Array.from({ length: SLIDE_COUNT }, (_, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            role="tab"
            aria-selected={index === slideIndex}
            aria-label={slideIndex === 0 ? "Discover leagues" : "Try classics"}
            className={cn(
              "home-promo-row__dot",
              index === slideIndex && "home-promo-row__dot--active",
            )}
            onClick={() => goTo(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
}
