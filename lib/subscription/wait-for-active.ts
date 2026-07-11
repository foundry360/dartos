interface SubscriptionSyncResponse {
  active?: boolean;
  error?: string;
}

interface SubscriptionSyncIds {
  subscriptionId?: string | null;
  sessionId?: string | null;
}

export async function waitForSubscriptionActive(
  ids?: SubscriptionSyncIds | string | null,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<{ active: boolean; error?: string }> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 1000;
  const syncIds: SubscriptionSyncIds =
    typeof ids === "string" || ids === null || ids === undefined
      ? { subscriptionId: ids ?? null }
      : ids;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch("/api/subscription/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: syncIds.subscriptionId ?? null,
          sessionId: syncIds.sessionId ?? null,
        }),
      });

      const data = (await response.json()) as SubscriptionSyncResponse;

      if (data.active) {
        return { active: true };
      }

      if (!response.ok && data.error && (response.status === 503 || response.status === 500)) {
        return { active: false, error: data.error };
      }
    } catch {
      // Keep polling until attempts are exhausted.
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, intervalMs);
      });
    }
  }

  return {
    active: false,
    error: "Your subscription is still being confirmed. Please wait a moment and try again.",
  };
}
