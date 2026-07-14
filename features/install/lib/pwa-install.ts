import {
  isIPadDevice,
  isIPhoneDevice,
  isSafariBrowser,
  isStandaloneDisplay,
} from "@/utils/fullscreen";

export type BeforeInstallPromptOutcome = "accepted" | "dismissed";

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BeforeInstallPromptOutcome }>;
}

export function isAppInstalled(): boolean {
  return isStandaloneDisplay();
}

/** iPhone/iPad in a browser tab — Share → Add to Home Screen (incl. Chrome on iOS). */
export function needsIosAddToHomeScreenInstructions(): boolean {
  if (typeof window === "undefined" || isAppInstalled()) {
    return false;
  }

  return isIPhoneDevice() || isIPadDevice();
}

/** Desktop/Android Chromium browsers can fire beforeinstallprompt when eligible. */
export function supportsNativeInstallPrompt(): boolean {
  if (typeof window === "undefined" || isAppInstalled()) {
    return false;
  }

  if (needsIosAddToHomeScreenInstructions()) {
    return false;
  }

  if (isSafariBrowser()) {
    return false;
  }

  return true;
}

export function getInstallPlatformLabel(): string {
  if (needsIosAddToHomeScreenInstructions()) {
    return isIPadDevice() ? "iPad" : "iPhone";
  }

  if (typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent)) {
    return "Windows";
  }

  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
    return "Android";
  }

  return "this device";
}
