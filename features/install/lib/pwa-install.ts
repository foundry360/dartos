import { APP_NAME } from "@/lib/theme";
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

  if (isChromeOnAppleMobile()) {
    return [
      `In Chrome, tap the ••• menu, then Share`,
      "Choose Add to Home Screen (or open this page in Safari first if you don’t see that option)",
      `Tap Add, then open ${APP_NAME} from your ${platform} Home Screen`,
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
      "Open this site in Chrome (production HTTPS)",
      "Click the install icon in the address bar (computer with a down arrow), or open Chrome’s menu → Cast, save, and share → Install page as app…",
      `Click Install to add ${APP_NAME} to your Applications folder`,
    ];
  }

  if (isWindowsDevice()) {
    return [
      "Open this site in Chrome or Edge (production HTTPS)",
      "Click the install icon in the address bar, or open the browser menu → Apps / Install page as app",
      `Click Install to pin ${APP_NAME} to your Start menu and desktop`,
    ];
  }

  return [
    "Open this site in Chrome or Edge over HTTPS",
    "Use the install icon in the address bar, or the browser menu → Install page as app",
    "Click Install",
  ];
}

export function getNativeInstallUnavailableMessage(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "Install isn’t available on local development. Open the live site (HTTPS) in Chrome or Edge, then try again.";
  }

  if (isMacDevice()) {
    return "Chrome didn’t offer a one-tap install yet. Use the address-bar install icon, or Chrome menu → Cast, save, and share → Install page as app…";
  }

  if (isWindowsDevice()) {
    return "Chrome/Edge didn’t offer a one-tap install yet. Use the address-bar install icon, or the browser menu → Install page as app.";
  }

  return "Install isn’t available as a one-tap button right now. Use your browser’s Install page as app option, or try again after the page finishes loading.";
}
