/** Normalize and validate ISO 3166-1 alpha-2 country codes. */
export function normalizeCountryCode(
  countryCode: string | null | undefined,
): string | null {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) {
    return null;
  }
  return countryCode.toUpperCase();
}

/**
 * Flag image URL (PNG). Prefer images over emoji — Windows often renders
 * regional-indicator emoji as bare letters like "US" / "MX" / "GB".
 */
export function countryFlagImageUrl(
  countryCode: string | null | undefined,
  width = 40,
): string | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) {
    return null;
  }

  // Prefer 40px assets even for small UI slots — tiny w20 PNGs often decode
  // as empty/black tiles on iOS Safari when CSS-scaled.
  const size = width <= 40 ? 40 : 80;
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

/** @deprecated Prefer countryFlagImageUrl / CountryFlag — emoji fails on Windows. */
export function countryCodeToFlagEmoji(countryCode: string | null | undefined): string | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) {
    return null;
  }

  const first = 0x1f1e6 + code.charCodeAt(0) - 65;
  const second = 0x1f1e6 + code.charCodeAt(1) - 65;
  return String.fromCodePoint(first, second);
}
