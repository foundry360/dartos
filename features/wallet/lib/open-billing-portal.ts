interface BillingPortalResponse {
  url?: string;
  error?: string;
}

interface OpenBillingPortalOptions {
  flow?: "payment_method_update";
}

export async function openBillingPortal(
  options: OpenBillingPortalOptions = {},
): Promise<void> {
  const response = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  const payload = (await response.json()) as BillingPortalResponse;

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Unable to open billing portal.");
  }

  window.location.assign(payload.url);
}
