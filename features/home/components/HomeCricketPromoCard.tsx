"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface HomeCricketPromoCardProps {
  className?: string;
  titleId?: string;
  priorityImage?: boolean;
}

export function HomeCricketPromoCard({
  className,
  titleId = "home-cricket-promo-title",
  priorityImage = false,
}: HomeCricketPromoCardProps) {
  return (
    <Link
      href="/cricket/setup?variant=classic"
      className={cn("home-classics-promo home-classics-promo--cricket", className)}
      aria-labelledby={titleId}
    >
      <div className="home-classics-promo__thrower" aria-hidden>
        <Image
          src="/player/ready-to-play-banner.png"
          alt=""
          fill
          priority={priorityImage}
          sizes="240px"
          className="home-classics-promo__thrower-image home-classics-promo__thrower-image--cricket"
        />
      </div>

      <h2 id={titleId} className="home-classics-promo__title">
        Ready for Cricket?
      </h2>
      <p className="home-classics-promo__copy">
        Close the numbers and take the board.
      </p>

      <span className="home-classics-promo__cta">
        Play Cricket
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
