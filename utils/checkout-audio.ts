import {
  buildCheckoutRequireClipPath,
  buildCheckoutRequirePhrase,
  buildNoFinishClipPath,
  buildNoFinishPhrase,
  getCheckoutRequireClipEntries,
  type CheckoutCallout,
} from "@/lib/checkout-callouts";
import {
  announceLegacyClipPath,
  prefetchCommentaryEntries,
  prefetchLegacyClipPath,
  primeCommentaryCache,
} from "@/utils/commentary-audio";

function getCheckoutClipPath(callout: CheckoutCallout): string {
  if (callout.type === "require") {
    return buildCheckoutRequireClipPath(callout.remaining);
  }

  return buildNoFinishClipPath();
}

function getCheckoutPhrase(callout: CheckoutCallout): string {
  if (callout.type === "require") {
    return buildCheckoutRequirePhrase(callout.remaining);
  }

  return buildNoFinishPhrase();
}

export function primeCheckoutClips(): void {
  prefetchCommentaryEntries("checkout", getCheckoutRequireClipEntries());
  prefetchLegacyClipPath(buildNoFinishClipPath(), buildNoFinishPhrase());
}

export async function playCheckoutClip(callout: CheckoutCallout): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  await announceLegacyClipPath(getCheckoutClipPath(callout), getCheckoutPhrase(callout));
  return true;
}

export async function announceCheckoutCallout(callout: CheckoutCallout): Promise<void> {
  await announceLegacyClipPath(getCheckoutClipPath(callout), getCheckoutPhrase(callout));
}

export function warmCheckoutCache(): void {
  primeCommentaryCache();
}
