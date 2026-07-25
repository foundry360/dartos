"use client";

import Link from "next/link";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="home-classics-promo__tool-icon"
      aria-hidden
    >
      <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19.6l1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
    </svg>
  );
}

/** iPhone home only: classics promo under the game mode grid. */
export function HomeIPhoneClassicsPromo() {
  return (
    <section className="home-classics-promo" aria-labelledby="home-classics-promo-title">
      <div className="home-classics-promo__board" aria-hidden>
        <HomeRecentMatchDartboard />
      </div>

      <div className="home-classics-promo__top">
        <span className="home-classics-promo__badge">
          <span className="home-classics-promo__badge-dot" aria-hidden />
          New
        </span>
        <div className="home-classics-promo__tools" aria-hidden>
          <span className="home-classics-promo__tool home-classics-promo__tool--board">
            <HomeRecentMatchDartboard />
          </span>
          <span className="home-classics-promo__tool">
            <StarIcon />
          </span>
        </div>
      </div>

      <h2 id="home-classics-promo-title" className="home-classics-promo__title">
        Four new games just hit the board.
      </h2>
      <p className="home-classics-promo__copy">
        Bob&apos;s 27, Shanghai, Halve It, and 121 Checkout: reimagined
        classics, ready to play.
      </p>

      <Link href="/play/setup" className="home-classics-promo__cta">
        Try classics
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
