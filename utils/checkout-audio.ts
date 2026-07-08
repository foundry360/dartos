import {
  buildCheckoutRequireClipPath,
  buildCheckoutRequirePhrase,
  buildNoFinishClipPath,
  buildNoFinishPhrase,
  type CheckoutCallout,
  CHECKOUT_CLIP_BASE_PATH,
} from "@/lib/checkout-callouts";
import { speakFreePhrase } from "@/utils/free-speech";

let activeCheckoutAudio: HTMLAudioElement | null = null;

function stopActiveCheckoutAudio(): void {
  if (!activeCheckoutAudio) {
    return;
  }

  activeCheckoutAudio.pause();
  activeCheckoutAudio.currentTime = 0;
  activeCheckoutAudio = null;
}

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
  if (typeof window === "undefined") {
    return;
  }

  const warmRequire = new Audio(buildCheckoutRequireClipPath(32));
  warmRequire.preload = "auto";
  warmRequire.load();

  const warmNoFinish = new Audio(buildNoFinishClipPath());
  warmNoFinish.preload = "auto";
  warmNoFinish.load();
}

export async function playCheckoutClip(callout: CheckoutCallout): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveCheckoutAudio();

  const audio = new Audio(getCheckoutClipPath(callout));
  audio.volume = 0.95;
  audio.preload = "auto";
  activeCheckoutAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeCheckoutAudio === audio) {
          activeCheckoutAudio = null;
        }

        if (failed) {
          reject(new Error("Checkout clip playback failed"));
          return;
        }

        resolve();
      };

      audio.onended = () => cleanup(false);
      audio.onerror = () => cleanup(true);
      void audio.play().catch(() => cleanup(true));
    });

    return true;
  } catch {
    return false;
  }
}

export async function announceCheckoutCallout(callout: CheckoutCallout): Promise<void> {
  const playedClip = await playCheckoutClip(callout);
  if (playedClip) {
    return;
  }

  await speakFreePhrase(getCheckoutPhrase(callout));
}

export function warmCheckoutCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  const warmClip = new Audio(`${CHECKOUT_CLIP_BASE_PATH}/no-finish.wav`);
  warmClip.preload = "auto";
  warmClip.load();
}
