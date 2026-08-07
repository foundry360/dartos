"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ActiveMatchSummary } from "@/features/match-play/lib/use-active-match";
import { isPhoneLayoutDevice } from "@/utils/fullscreen";

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
  match: ActiveMatchSummary | null;
}

export function HomeResumeMatchCard({ match }: HomeResumeMatchCardProps) {
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    setIsIPhone(isPhoneLayoutDevice());
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="home-resume-card"
    >
      <div className="home-resume-card__main">
        <h2 className="home-section__title home-resume-card__eyebrow">Active Match</h2>

        <div className="home-resume-card__content">
          <div className="home-resume-card__icon" aria-hidden>
            <ClockIcon />
          </div>

          <div className="home-resume-card__copy">
            <div className="home-resume-card__title-row">
              {match ? (
                <>
                  <h2 className="home-resume-card__title">
                    {match.userName}{" "}
                    <span className="home-resume-card__versus">vs</span> {match.opponentName}
                  </h2>

                  {!isIPhone ? (
                    <Link href={match.href} className="home-resume-card__action">
                      Resume
                    </Link>
                  ) : null}
                </>
              ) : (
                <h2 className="home-resume-card__title home-resume-card__title--empty">
                  No active matches
                </h2>
              )}
            </div>

            {match ? (
              isIPhone ? (
                <div className="home-resume-card__meta-row">
                  <p className="home-resume-card__meta">
                    {match.matchType} • {match.progress}
                  </p>
                  <Link href={match.href} className="home-resume-card__action">
                    Resume
                  </Link>
                </div>
              ) : (
                <p className="home-resume-card__meta">
                  {match.matchType} • {match.progress}
                </p>
              )
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
