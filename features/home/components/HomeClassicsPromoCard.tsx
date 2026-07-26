"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface HomeClassicsPromoCardProps {
  className?: string;
  titleId?: string;
  priorityImage?: boolean;
}

export function HomeClassicsPromoCard({
  className,
  titleId = "home-classics-promo-title",
  priorityImage = false,
}: HomeClassicsPromoCardProps) {
  return (
    <section
      className={cn("home-classics-promo home-classics-promo--classics", className)}
      aria-labelledby={titleId}
    >
      <div className="home-classics-promo__thrower" aria-hidden>
        <Image
          src="/player/classics-promo-banner.png"
          alt=""
          fill
          priority={priorityImage}
          sizes="320px"
          className="home-classics-promo__thrower-image home-classics-promo__thrower-image--classics"
        />
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
