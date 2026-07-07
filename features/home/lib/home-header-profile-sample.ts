/** Mockup reference value for home header preview in development. */
export const HOME_SAMPLE_THREE_DART_AVERAGE = 62.4;

export function getHomeThreeDartAveragePreview(threeDartAverage: number): number {
  if (threeDartAverage > 0) {
    return threeDartAverage;
  }

  if (process.env.NODE_ENV === "development") {
    return HOME_SAMPLE_THREE_DART_AVERAGE;
  }

  return threeDartAverage;
}
