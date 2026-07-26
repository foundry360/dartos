"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface HomeX01PromoCardProps {
  className?: string;
  titleId?: string;
  priorityImage?: boolean;
}

export function HomeX01PromoCard({
  className,
  titleId = "home-x01-promo-title",
  priorityImage = false,
}: HomeX01PromoCardProps) {
  return (
    <Link
      href="/x01/setup"
      className={cn("home-classics-promo home-classics-promo--x01", className)}
      aria-labelledby={titleId}
    >
      <div className="home-classics-promo__thrower" aria-hidden>
        <Image
          src="/player/x01-promo-banner.png"
          alt=""
          fill
          priority={priorityImage}
          sizes="240px"
          className="home-classics-promo__thrower-image home-classics-promo__thrower-image--x01"
        />
      </div>

      <h2 id={titleId} className="home-classics-promo__title">
        Ready for X01?
      </h2>
      <p className="home-classics-promo__copy">
        Race to zero — 501 and more.
      </p>

      <span className="home-classics-promo__cta">
        Play X01
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
