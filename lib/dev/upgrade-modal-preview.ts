/** Query values: `1` / `trial` (trial copy) or `free` (league-player copy). */
export function getUpgradeModalPreviewVariant(
  previewParam: string | null | undefined,
): "trial" | "free" | null {
  if (previewParam !== "1" && previewParam !== "trial" && previewParam !== "free") {
    return null;
  }

  const allowed =
    process.env.NODE_ENV === "development" ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV != null &&
      process.env.NEXT_PUBLIC_VERCEL_ENV !== "production");

  if (!allowed) {
    return null;
  }

  return previewParam === "free" ? "free" : "trial";
}
