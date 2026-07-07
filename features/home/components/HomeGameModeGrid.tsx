"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HomeGameModeIcon } from "@/features/home/components/HomeGameModeIcons";
import { HOME_GAME_MODES } from "@/features/home/lib/home-game-modes";

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function HomeGameModeGrid() {
  return (
    <section className="home-section">
      <h2 className="home-section__title">Start a New Match</h2>
      <div className="home-mode-grid">
        {HOME_GAME_MODES.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className={mode.id === "practice" ? "home-mode-grid__item home-mode-grid__item--wide" : "home-mode-grid__item"}
          >
            <Link href={mode.href} className="home-mode-card">
              <span className="home-mode-card__icon">
                <HomeGameModeIcon modeId={mode.id} />
              </span>

              <div className="home-mode-card__body">
                <div className="home-mode-card__heading">
                  <h3 className="home-mode-card__title">{mode.title}</h3>
                  <span className="home-mode-card__arrow" aria-hidden>
                    <ArrowRightIcon />
                  </span>
                </div>
                <p className="home-mode-card__description">{mode.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
