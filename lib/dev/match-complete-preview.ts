export function isMatchCompletePreviewEnabled(
  previewComplete: string | null | undefined,
): boolean {
  return process.env.NODE_ENV === "development" && previewComplete === "1";
}
