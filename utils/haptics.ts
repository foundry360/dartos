type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const STYLE_TO_MS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  warning: [20, 40],
  error: [30, 20, 30],
};

export function triggerHaptic(style: HapticStyle = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  const pattern = STYLE_TO_MS[style];
  navigator.vibrate(pattern);
}
