"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HomeClassicsPromoCard } from "@/features/home/components/HomeClassicsPromoCard";
import { HomeCricketPromoCard } from "@/features/home/components/HomeCricketPromoCard";
import { HomeLeaguePromoCard } from "@/features/home/components/HomeLeaguePromoCard";
import { HomeX01PromoCard } from "@/features/home/components/HomeX01PromoCard";
import { cn } from "@/utils/cn";

const CYCLE_MS = 4800;

type BannerSlide = { key: string; label: string; content: ReactNode };

const SLIDES: [BannerSlide, BannerSlide, BannerSlide, BannerSlide] = [
  {
    key: "league",
    label: "Discover leagues",
    content: <HomeLeaguePromoCard priorityImage />,
  },
  {
    key: "classics",
    label: "Try classics",
    content: <HomeClassicsPromoCard titleId="home-iphone-classics-promo-title" />,
  },
  {
    key: "cricket",
    label: "Play Cricket",
    content: <HomeCricketPromoCard titleId="home-iphone-cricket-promo-title" />,
  },
  {
    key: "x01",
    label: "Play X01",
    content: <HomeX01PromoCard titleId="home-iphone-x01-promo-title" />,
  },
];

/** iPhone home only: League, classics, Cricket, and X01 — auto-cycling hero. */
export function HomeIPhoneBanner() {
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
      className="home-iphone-banner home-iphone-banner--carousel home-iphone-banner--promo"
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
          <motion.div
            key={activeSlide.key}
            className="home-iphone-banner__slide"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeSlide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="home-iphone-banner__dots" role="tablist" aria-label="Banner slides">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            aria-selected={index === slideIndex}
            aria-label={slide.label}
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
