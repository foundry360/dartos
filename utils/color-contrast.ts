function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const normalized = color.trim().replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string): number | null {
  const rgb = parseHexColor(color);

  if (!rgb) {
    return null;
  }

  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/** Returns light or dark text for readable contrast on a hex background. */
export function getContrastTextColor(
  backgroundColor: string,
  lightText = "#ffffff",
  darkText = "#070708",
): string {
  const luminance = getRelativeLuminance(backgroundColor);

  if (luminance === null) {
    return lightText;
  }

  return luminance > 0.45 ? darkText : lightText;
}
