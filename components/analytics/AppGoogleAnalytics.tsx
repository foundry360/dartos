import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getGaMeasurementId } from "@/lib/analytics/ga";
import { GoogleAnalyticsRouteTracker } from "@/components/analytics/GoogleAnalyticsRouteTracker";

/** Loads GA4 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */
export function AppGoogleAnalytics() {
  const gaId = getGaMeasurementId();

  if (!gaId) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <Suspense fallback={null}>
        <GoogleAnalyticsRouteTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
