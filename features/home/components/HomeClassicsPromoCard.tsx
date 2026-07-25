"use client";

import Link from "next/link";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import { cn } from "@/utils/cn";

interface HomeClassicsPromoCardProps {
  className?: string;
  titleId?: string;
}

export function HomeClassicsPromoCard({
  className,
  titleId = "home-classics-promo-title",
}: HomeClassicsPromoCardProps) {
  return (
    <section
      className={cn("home-classics-promo home-classics-promo--classics", className)}
      aria-labelledby={titleId}
    >
      <div className="home-classics-promo__board" aria-hidden>
        <HomeRecentMatchDartboard />
      </div>

      <div className="home-classics-promo__top">
        <span className="home-classics-promo__badge">
          <span className="home-classics-promo__badge-dot" aria-hidden />
          New
        </span>
      </div>

      <h2 id={titleId} className="home-classics-promo__title">
        Four new games just hit the board.
      </h2>
      <p className="home-classics-promo__copy">
        Bob&apos;s 27, Shanghai, Halve It, and 121 Checkout.
      </p>

      <Link href="/play/setup" className="home-classics-promo__cta">
        Try classics
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
