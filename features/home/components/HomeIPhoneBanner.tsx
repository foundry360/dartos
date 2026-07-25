"use client";

import Image from "next/image";

/** iPhone home only — same dart-thrower art as the league player account screen. */
export function HomeIPhoneBanner() {
  return (
    <div className="home-iphone-banner" aria-hidden>
      <Image
        src="/player/account-banner.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="home-iphone-banner__image"
      />
      <div className="home-iphone-banner__fade" />
    </div>
  );
}
