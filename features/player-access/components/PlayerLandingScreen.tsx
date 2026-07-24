"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayerAppShell } from "@/features/player-access/components/PlayerAppShell";
import {
  PLAYER_DISCOVER_PATH,
  PLAYER_MY_LEAGUES_PATH,
} from "@/lib/auth/routes";
import "@/features/player-access/player-access.css";

const LANDING_CARDS = [
  {
    href: PLAYER_MY_LEAGUES_PATH,
    title: "My leagues",
    description: "View your registered leagues, standings, and upcoming play.",
    imageSrc: "/player/landing-my-leagues.png",
    imageAlt: "Dart player throwing in competition",
  },
  {
    href: PLAYER_DISCOVER_PATH,
    title: "Discover leagues",
    description: "Find open leagues near you or join with a code from a director.",
    imageSrc: "/player/landing-discover.png",
    imageAlt: "Dartboard with three darts clustered near the center",
  },
] as const;

export function PlayerLandingScreen() {
  return (
    <PlayerAppShell heading="League players" className="shell-page player-landing-page">
      <div className="player-landing">
        {LANDING_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="player-landing__card"
          >
            <Image
              src={card.imageSrc}
              alt={card.imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 420px"
              className="player-landing__card-image"
              priority
            />
            <span className="player-landing__card-scrim" aria-hidden />
            <span className="player-landing__card-copy">
              <span className="player-landing__card-title">{card.title}</span>
              <span className="player-landing__card-desc">{card.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </PlayerAppShell>
  );
}
