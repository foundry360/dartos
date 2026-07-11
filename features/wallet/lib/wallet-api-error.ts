export function getWalletApiErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof TypeError && caught.message === "Failed to fetch") {
    return "Unable to reach the server. Wait a moment and try again.";
  }

  return caught instanceof Error ? caught.message : fallback;
}

export async function postWalletApi<T extends { error?: string }>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (caught) {
    throw new Error(getWalletApiErrorMessage(caught, "Request failed."));
  }

  let payload: T;

  try {
    payload = (await response.json()) as T;
  } catch {
    throw new Error("Server returned an unexpected response.");
  }

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}
