"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ActiveMatchSummary } from "@/features/home/lib/use-active-match";

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="home-resume-card__clock-icon"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7v5.25l3.25 2" />
    </svg>
  );
}

interface HomeResumeMatchCardProps {
  match: ActiveMatchSummary;
}

export function HomeResumeMatchCard({ match }: HomeResumeMatchCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="home-resume-card"
    >
      <div className="home-resume-card__main">
        <span className="home-resume-card__eyebrow">Active Match</span>

        <div className="home-resume-card__content">
          <div className="home-resume-card__icon" aria-hidden>
            <ClockIcon />
          </div>

          <div className="home-resume-card__copy">
            <h2 className="home-resume-card__title">
              {match.userName} <span className="home-resume-card__versus">vs</span> {match.opponentName}
            </h2>
            <p className="home-resume-card__meta">
              {match.matchType} • {match.progress}
            </p>
          </div>
        </div>
      </div>

      <Link href={match.href} className="home-resume-card__action">
        Continue Match
      </Link>
    </motion.section>
  );
}
