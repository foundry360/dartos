/** Fire-and-forget client helper after member signup verification / subscribe visit. */
export function requestCheckoutReminderEmailSchedule(): void {
  if (typeof window === "undefined") {
    return;
  }

  void fetch("/api/emails/schedule-checkout-reminder", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
}
