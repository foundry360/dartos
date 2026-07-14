import { APP_NAME } from "@/lib/theme";
import {
  isInstalledPwa,
  isIPadDevice,
  isIPhoneDevice,
  isSafariBrowser,
} from "@/utils/fullscreen";

export type BeforeInstallPromptOutcome = "accepted" | "dismissed";

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BeforeInstallPromptOutcome }>;
}

export function isAppInstalled(): boolean {
  return isInstalledPwa();
}

/** iPhone/iPad in a browser tab — Share → Add to Home Screen (incl. Chrome on iOS). */
export function needsIosAddToHomeScreenInstructions(): boolean {
  if (typeof window === "undefined" || isAppInstalled()) {
    return false;
  }

  return isIPhoneDevice() || isIPadDevice();
}

/** Chrome (or other non-Safari) browser on iPhone/iPad. */
export function isChromeOnAppleMobile(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent) || (
    (isIPhoneDevice() || isIPadDevice()) && !isSafariBrowser()
  );
}

/** Numbered Share → Add to Home Screen steps for iPhone/iPad. */
export function getIosAddToHomeScreenSteps(): string[] {
  const platform = isIPadDevice() ? "iPad" : "iPhone";

  // Chrome/Firefox/Edge on iOS can’t install home-screen apps — Safari is required.
  if (isChromeOnAppleMobile()) {
    return [
      "Open this site in Safari (Chrome can’t add apps to the Home Screen)",
      isIPadDevice()
        ? "In Safari’s toolbar, tap the Share button"
        : "Tap the Share button at the bottom of Safari",
      "Scroll and tap Add to Home Screen",
      `Tap Add, then open ${APP_NAME} from your Home Screen`,
    ];
  }

  if (isIPadDevice()) {
    return [
      "In Safari’s toolbar, tap the Share button",
      "Scroll and tap Add to Home Screen",
      `Tap Add, then open ${APP_NAME} from your Home Screen`,
    ];
  }

  return [
    "Tap the Share button at the bottom of Safari",
    "Scroll and tap Add to Home Screen",
    `Tap Add, then open ${APP_NAME} from your Home Screen`,
  ];
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

export function isMacDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Macintosh|Mac OS X/i.test(navigator.userAgent);
}

export function isWindowsDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Windows/i.test(navigator.userAgent);
}

export function getInstallPlatformLabel(): string {
  if (needsIosAddToHomeScreenInstructions()) {
    return isIPadDevice() ? "iPad" : "iPhone";
  }

  if (isWindowsDevice()) {
    return "Windows";
  }

  if (isMacDevice()) {
    return "Mac";
  }

  if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
    return "Android";
  }

  return "this device";
}

/** Desktop Chrome/Edge when the native prompt event has not been offered. */
export function getDesktopChromiumInstallSteps(): string[] {
  if (isMacDevice()) {
    return [
      "In Chrome, click the install icon in the address bar (or menu → Install page as app)",
      "Click Install",
    ];
  }

  if (isWindowsDevice()) {
    return [
      "In Chrome or Edge, click the install icon in the address bar (or menu → Install page as app)",
      "Click Install",
    ];
  }

  return [
    "In Chrome or Edge, click the install icon in the address bar (or menu → Install page as app)",
    "Click Install",
  ];
}
