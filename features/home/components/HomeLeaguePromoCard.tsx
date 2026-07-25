"use client";

import Image from "next/image";
import Link from "next/link";
import { PLAYER_DISCOVER_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

interface HomeLeaguePromoCardProps {
  className?: string;
  titleId?: string;
  priorityImage?: boolean;
}

export function HomeLeaguePromoCard({
  className,
  titleId = "home-league-promo-title",
  priorityImage = false,
}: HomeLeaguePromoCardProps) {
  return (
    <Link
      href={PLAYER_DISCOVER_PATH}
      className={cn("home-classics-promo home-classics-promo--league", className)}
      aria-labelledby={titleId}
    >
      <div className="home-classics-promo__thrower" aria-hidden>
        <Image
          src="/player/account-banner.png"
          alt=""
          fill
          priority={priorityImage}
          sizes="240px"
          className="home-classics-promo__thrower-image"
        />
      </div>

      <div className="home-classics-promo__top">
        <span className="home-classics-promo__badge">
          <span className="home-classics-promo__badge-dot" aria-hidden />
          New
        </span>
      </div>

      <h2 id={titleId} className="home-classics-promo__title">
        Discover leagues near you.
      </h2>
      <p className="home-classics-promo__copy">
        Find a league, register, and get on the schedule.
      </p>

      <span className="home-classics-promo__cta">
        Discover leagues
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
