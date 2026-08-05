/** Fire-and-forget client helper after signup verification. */
export function requestGhlContactSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  void fetch("/api/ghl/sync-contact", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch(() => undefined);
}
