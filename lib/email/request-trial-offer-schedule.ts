/** Fire-and-forget client helper after free player signup verification. */
export function requestTrialOfferEmailSchedule(): void {
  if (typeof window === "undefined") {
    return;
  }

  void fetch("/api/emails/schedule-trial-offer", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
}
