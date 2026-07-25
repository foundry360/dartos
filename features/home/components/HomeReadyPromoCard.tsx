"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface HomeReadyPromoCardProps {
  className?: string;
  titleId?: string;
  priorityImage?: boolean;
}

export function HomeReadyPromoCard({
  className,
  titleId = "home-ready-promo-title",
  priorityImage = false,
}: HomeReadyPromoCardProps) {
  return (
    <div
      className={cn("home-classics-promo home-classics-promo--ready", className)}
      aria-labelledby={titleId}
      aria-live="polite"
    >
      <div className="home-classics-promo__thrower" aria-hidden>
        <Image
          src="/player/ready-to-play-banner.png"
          alt=""
          fill
          priority={priorityImage}
          sizes="240px"
          className="home-classics-promo__thrower-image home-classics-promo__thrower-image--ready"
        />
      </div>

      <div className="home-classics-promo__top">
        <span className="home-classics-promo__badge">
          <span className="home-classics-promo__badge-dot" aria-hidden />
          Play
        </span>
      </div>

      <h2 id={titleId} className="home-classics-promo__title">
        Ready to play?
      </h2>
      <p className="home-classics-promo__copy">
        Pick a format and get on the board.
      </p>

      <Link href="/play/setup" className="home-classics-promo__cta">
        Start a match
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
