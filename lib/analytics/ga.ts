/** GA4 measurement ID (e.g. G-XXXXXXXX). Empty when analytics is disabled. */
export function getGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || null;
}
