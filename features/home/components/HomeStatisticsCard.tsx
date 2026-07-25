"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type HomeStat = {
  id: string;
  label: string;
  value: string;
  icon: ReactNode;
};

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="home-stats-card__icon-svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="home-stats-carousel__chevron-icon"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

const HOME_STATS: HomeStat[] = [
  {
    id: "matches",
    label: "Matches Played",
    value: "84",
    icon: (
      <StatIcon>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </StatIcon>
    ),
  },
  {
    id: "wins",
    label: "Wins",
    value: "46",
    icon: (
      <StatIcon>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 4h2a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4" />
        <path d="M7 4H5a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4" />
      </StatIcon>
    ),
  },
  {
    id: "win-rate",
    label: "Win Rate",
    value: "55%",
    icon: (
      <StatIcon>
        <path d="M3 17 9 11l4 4 7-8" />
        <path d="M14 7h6v6" />
      </StatIcon>
    ),
  },
  {
    id: "current-streak",
    label: "Current Streak",
    value: "3 Wins",
    icon: (
      <StatIcon>
        <path d="M12 3c2 3 2 5 1 7 2 0 4 1 5 3-1 4-4 7-6 8-2-1-5-4-6-8 1-2 3-3 5-3-1-2-1-4 1-7Z" />
      </StatIcon>
    ),
  },
  {
    id: "best-game",
    label: "Best Game",
    value: "501",
    icon: (
      <StatIcon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </StatIcon>
    ),
  },
  {
    id: "bullseyes",
    label: "Bullseyes",
    value: "128",
    icon: (
      <StatIcon>
        <path d="m12 3 1.8 5.5H19l-4.4 3.2 1.7 5.3L12 14.8 7.7 17l1.7-5.3L5 8.5h5.2L12 3Z" />
      </StatIcon>
    ),
  },
  {
    id: "highest-score",
    label: "Highest Score",
    value: "180",
    icon: (
      <StatIcon>
        <path d="M4 14h4l2-9 3 14 2-7h5" />
      </StatIcon>
    ),
  },
  {
    id: "practice-streak",
    label: "Practice Streak",
    value: "5 Days",
    icon: (
      <StatIcon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
      </StatIcon>
    ),
  },
];

const LOOP_SETS = 3;

interface HomeStatisticsCardProps {
  className?: string;
}

export function HomeStatisticsCard({ className }: HomeStatisticsCardProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const ignoreScrollRef = useRef(false);

  const loopedStats = Array.from({ length: LOOP_SETS }, (_, setIndex) =>
    HOME_STATS.map((stat) => ({
      ...stat,
      key: `${setIndex}-${stat.id}`,
    })),
  ).flat();

  const measureStep = useCallback(() => {
    const viewport = viewportRef.current;
    const track = viewport?.querySelector<HTMLElement>(".home-stats-carousel__track");
    const firstCard = viewport?.querySelector<HTMLElement>(".home-stats-card");
    if (!viewport || !track || !firstCard) {
      return 0;
    }

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return firstCard.getBoundingClientRect().width + gap;
  }, []);

  const scrollToHalfOffset = useCallback(
    (cardIndex: number, behavior: ScrollBehavior = "auto") => {
      const viewport = viewportRef.current;
      const nextStep = measureStep();
      if (!viewport || nextStep <= 0) {
        return;
      }

      setStep(nextStep);
      ignoreScrollRef.current = true;
      viewport.scrollTo({
        left: cardIndex * nextStep + nextStep / 2,
        behavior,
      });
      window.setTimeout(() => {
        ignoreScrollRef.current = false;
      }, behavior === "smooth" ? 380 : 0);
    },
    [measureStep],
  );

  useLayoutEffect(() => {
    // Start on the middle copy, offset by half a card so load shows
    // half of the first stat and half of the second.
    scrollToHalfOffset(HOME_STATS.length, "auto");
  }, [scrollToHalfOffset]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const onResize = () => {
      const nextStep = measureStep();
      if (nextStep <= 0) {
        return;
      }
      setStep(nextStep);
      const currentIndex = Math.round((viewport.scrollLeft - nextStep / 2) / nextStep);
      scrollToHalfOffset(currentIndex, "auto");
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureStep, scrollToHalfOffset]);

  const normalizeLoop = useCallback(() => {
    const viewport = viewportRef.current;
    const nextStep = step || measureStep();
    if (!viewport || nextStep <= 0) {
      return;
    }

    const setWidth = HOME_STATS.length * nextStep;
    const min = setWidth * 0.5;
    const max = setWidth * 2.5;

    if (viewport.scrollLeft < min || viewport.scrollLeft > max) {
      ignoreScrollRef.current = true;
      const normalized =
        ((((viewport.scrollLeft - nextStep / 2) % setWidth) + setWidth) % setWidth) +
        setWidth +
        nextStep / 2;
      viewport.scrollTo({ left: normalized, behavior: "auto" });
      window.setTimeout(() => {
        ignoreScrollRef.current = false;
      }, 0);
    }
  }, [measureStep, step]);

  const moveBy = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const nextStep = step || measureStep();
    if (!viewport || nextStep <= 0) {
      return;
    }

    ignoreScrollRef.current = true;
    viewport.scrollBy({ left: direction * nextStep, behavior: "smooth" });
    window.setTimeout(() => {
      ignoreScrollRef.current = false;
      normalizeLoop();
    }, 380);
  };

  return (
    <section
      className={cn("home-stats-section", className)}
      aria-labelledby="home-stats-title"
    >
      <div className="home-section__header home-stats-section__header">
        <h2 id="home-stats-title" className="home-section__title">
          Statistics
        </h2>
        <Link href="/statistics" className="home-section__link">
          View all
        </Link>
      </div>

      <div
        className="home-stats-carousel"
        aria-roledescription="carousel"
        aria-label="Statistics highlights"
      >
        <button
          type="button"
          className="home-stats-carousel__chevron home-stats-carousel__chevron--left"
          aria-label="Previous statistic"
          onClick={() => moveBy(-1)}
        >
          <ChevronIcon direction="left" />
        </button>

        <div
          ref={viewportRef}
          className="home-stats-carousel__viewport"
          onScroll={() => {
            if (!ignoreScrollRef.current) {
              normalizeLoop();
            }
          }}
        >
          <ul className="home-stats-carousel__track">
            {loopedStats.map((stat) => (
              <li key={stat.key} className="home-stats-card">
                <span className="home-stats-card__icon" aria-hidden>
                  {stat.icon}
                </span>
                <div className="home-stats-card__copy">
                  <span className="home-stats-card__value">{stat.value}</span>
                  <span className="home-stats-card__label">{stat.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="home-stats-carousel__chevron home-stats-carousel__chevron--right"
          aria-label="Next statistic"
          onClick={() => moveBy(1)}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </section>
  );
}
