"use client";

import { useState } from "react";
import {
  countryCodeToFlagEmoji,
  countryFlagImageUrl,
  normalizeCountryCode,
} from "@/features/community/lib/country-flag";
import { cn } from "@/utils/cn";

interface CountryFlagProps {
  countryCode: string | null | undefined;
  className?: string;
  title?: string;
  size?: number;
}

export function CountryFlag({
  countryCode,
  className,
  title,
  size = 40,
}: CountryFlagProps) {
  const code = normalizeCountryCode(countryCode);
  const src = countryFlagImageUrl(code, size);
  const [imageFailed, setImageFailed] = useState(false);

  if (!code) {
    return null;
  }

  if (imageFailed || !src) {
    const emoji = countryCodeToFlagEmoji(code);
    if (!emoji) {
      return null;
    }

    return (
      <span
        className={cn("community-country-flag community-country-flag--emoji", className)}
        title={title ?? code}
        aria-hidden
        style={{ fontSize: Math.max(12, Math.round(size * 0.72)), lineHeight: 1 }}
      >
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      title={title ?? code}
      width={size}
      height={Math.round(size * 0.75)}
      className={cn("community-country-flag", className)}
      /* Eager: iOS Safari often never loads lazy images inside overflow scorecards. */
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setImageFailed(true)}
    />
  );
}
