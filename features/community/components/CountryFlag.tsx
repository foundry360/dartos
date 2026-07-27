"use client";

import { countryFlagImageUrl, normalizeCountryCode } from "@/features/community/lib/country-flag";
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
  if (!code || !src) {
    return null;
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
      loading="lazy"
      decoding="async"
    />
  );
}
