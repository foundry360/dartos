"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SquareArrowLeftIcon } from "@/components/ui/SquareArrowLeftIcon";
import { cn } from "@/utils/cn";

interface PlayScreenHeroProps {
  className?: string;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
}

export function PlayScreenHero({
  className,
  backHref,
  backLabel = "Go back",
  eyebrow,
  title = "New Game",
  subtitle,
  centered = false,
}: PlayScreenHeroProps) {
  if (centered && backHref) {
    return (
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={cn(
          "play-screen-hero play-screen-hero--bar pt-safe-top landscape:pt-0",
          className,
        )}
      >
        <Link
          href={backHref}
          className="play-screen-hero__back relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center"
          aria-label={backLabel}
        >
          <SquareArrowLeftIcon />
        </Link>
        <h2 className="play-screen-hero__title play-screen-hero__title--inline min-w-0 flex-1 truncate text-center">
          {title}
        </h2>
      </motion.header>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("play-screen-hero", className)}
    >
      {backHref ? (
        <Link
          href={backHref}
          className="play-screen-hero__back mb-3 flex h-[52px] w-[52px] items-center justify-center"
          aria-label={backLabel}
        >
          <SquareArrowLeftIcon />
        </Link>
      ) : null}
      {eyebrow ? <p className="play-screen-hero__eyebrow">{eyebrow}</p> : null}
      <h2 className="play-screen-hero__title">{title}</h2>
      {subtitle ? <p className="play-screen-hero__subtitle">{subtitle}</p> : null}
    </motion.section>
  );
}
