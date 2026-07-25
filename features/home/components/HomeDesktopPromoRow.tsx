"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HomeClassicsPromoCard } from "@/features/home/components/HomeClassicsPromoCard";
import { HomeCricketPromoCard } from "@/features/home/components/HomeCricketPromoCard";
import { HomeLeaguePromoCard } from "@/features/home/components/HomeLeaguePromoCard";
import { HomeX01PromoCard } from "@/features/home/components/HomeX01PromoCard";
import { cn } from "@/utils/cn";

const CYCLE_MS = 4800;

type PromoSlide = { key: string; label: string; content: ReactNode };

const SLIDES: [PromoSlide, PromoSlide, PromoSlide, PromoSlide] = [
  {
    key: "league",
    label: "Discover leagues",
    content: (
      <HomeLeaguePromoCard
        className="home-classics-promo--slot"
        titleId="home-desktop-league-promo-title"
        priorityImage
      />
    ),
  },
  {
    key: "classics",
    label: "Try classics",
    content: (
      <HomeClassicsPromoCard
        className="home-classics-promo--slot"
        titleId="home-desktop-classics-promo-title"
      />
    ),
  },
  {
    key: "cricket",
    label: "Play Cricket",
    content: (
      <HomeCricketPromoCard
        className="home-classics-promo--slot"
        titleId="home-desktop-cricket-promo-title"
      />
    ),
  },
  {
    key: "x01",
    label: "Play X01",
    content: (
      <HomeX01PromoCard
        className="home-classics-promo--slot"
        titleId="home-desktop-x01-promo-title"
      />
    ),
  },
];

/**
 * iPad/desktop home: one promo card in the Active Match slot that rotates
 * between League, Classics, Cricket, and X01.
 */
export function HomeDesktopPromoRow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slideCount = SLIDES.length;
  const activeSlide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => {
    if (paused) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [paused, slideCount]);

  const goTo = (next: number) => {
    setIndex(((next % slideCount) + slideCount) % slideCount);
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
          <motion.div
            key={activeSlide.key}
            className="home-promo-row__slide"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeSlide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="home-promo-row__dots" role="tablist" aria-label="Promo slides">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            aria-selected={index === slideIndex}
            aria-label={slide.label}
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
