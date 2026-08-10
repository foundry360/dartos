import { APP_NAME } from "@/lib/theme";
import {
  isIPadDevice,
  isIPhoneDevice,
  isSafariBrowser,
} from "@/utils/fullscreen";

export type BeforeInstallPromptOutcome = "accepted" | "dismissed";

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BeforeInstallPromptOutcome }>;
}

/**
 * True only when launched from the Home Screen / installed PWA.
 * Do not treat transient fullscreen or minimal-ui as “installed” — that hid
 * Share → Add to Home Screen instructions on iPhone.
 */
export function isRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) {
    return true;
  }

  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isAppInstalled(): boolean {
  return isRunningAsInstalledApp();
}

export function isAppleMobileDevice(): boolean {
  return isIPhoneDevice() || isIPadDevice();
}

/** iPhone/iPad in a browser tab — Share → Add to Home Screen (incl. Chrome on iOS). */
export function needsIosAddToHomeScreenInstructions(): boolean {
  if (typeof window === "undefined" || isRunningAsInstalledApp()) {
    return false;
  }

  return isAppleMobileDevice();
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
  const shareLocation = isIPadDevice()
    ? "In Safari’s toolbar at the top, tap the **Share** button (square with an arrow pointing up)"
    : "At the bottom of Safari, tap the **Share** button (square with an arrow pointing up)";

  const safariInstallSteps = [
    shareLocation,
    "In the share sheet, scroll down past the app icons until you see action rows",
    "Tap **Add to Home Screen** (if you don’t see it, tap **Edit Actions…** or scroll further)",
    `On the next screen, keep the name **${APP_NAME}** (or edit it), then tap **Add** in the top-right`,
    `Go to your ${platform} **Home Screen** and tap the new **${APP_NAME}** icon to open the app`,
  ];

  // Chrome/Firefox/Edge on iOS can’t install home-screen apps — Safari is required.
  if (isChromeOnAppleMobile()) {
    return [
      "Copy this page’s address, then open the **Safari** app (Chrome and other browsers can’t add apps to the Home Screen on iPhone/iPad)",
      "Paste the address into Safari and open this site again",
      ...safariInstallSteps,
    ];
  }

  return [
    "Stay in **Safari** (this only works from Safari, not from a link opened inside another app)",
    ...safariInstallSteps,
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

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent);
}

export function getInstallPlatformLabel(): string {
  if (isIPadDevice()) {
    return "iPad";
  }

  if (isIPhoneDevice()) {
    return "iPhone";
  }

  if (isWindowsDevice()) {
    return "Windows";
  }

  if (isMacDevice()) {
    return "Mac";
  }

  if (isAndroidDevice()) {
    return "Android";
  }

  return "this device";
}

/** Where to find / reopen the installed app. **bold** markers are emphasized in the UI. */
export function getInstalledAppLaunchSteps(): string[] {
  if (isIPadDevice() || isIPhoneDevice()) {
    const place = isIPadDevice() ? "iPad" : "iPhone";
    return [
      `Go to your ${place} **Home Screen**`,
      `Find the **${APP_NAME}** icon`,
      "Tap it to open the full-screen app",
    ];
  }

  if (isMacDevice()) {
    return [
      "Open **Finder**, then go to **Applications**",
      `Find **${APP_NAME}**`,
      "Double-click to open — or drag it to your **Dock** or **Desktop** for quick access next time",
    ];
  }

  if (isWindowsDevice()) {
    return [
      "Open the **Start** menu",
      `Search for **${APP_NAME}**`,
      "Click to open — or right-click and choose **Pin to taskbar** so it’s easy to find next time",
    ];
  }

  if (isAndroidDevice()) {
    return [
      "Open your **app drawer** or **Home Screen**",
      `Find the **${APP_NAME}** icon`,
      "Tap it to open the full-screen app",
    ];
  }

  return [
    `Look for **${APP_NAME}** on your device’s app list, Dock, or home screen`,
    "Open it from there for the full-screen experience",
  ];
}

/**
 * Chrome on Android: Install app / Add to Home screen from the browser menu.
 * **bold** markers are rendered as emphasized labels in the Settings panel.
 */
export function getAndroidInstallSteps(): string[] {
  return [
    "In **Chrome**, tap menu **⋮** (top right)",
    "Tap **Add to Home screen** (this is the install entry on most tablets)",
    "On the next sheet, tap **Install app** — not Create shortcut, if you see both",
    "Tap **Install** to confirm",
    `Open the new **${APP_NAME}** icon from your Home Screen or app drawer`,
    "If Install never appears: open **chrome://webapks**, delete any old VectorOS entry, clear site data, reload",
  ];
}

/**
 * Desktop/Android Chromium install steps when beforeinstallprompt has not been offered.
 * **bold** markers are rendered as emphasized labels in the Settings panel.
 */
export function getDesktopChromiumInstallSteps(): string[] {
  if (isAndroidDevice()) {
    return getAndroidInstallSteps();
  }

  if (isMacDevice()) {
    return [
      "Click Chrome’s menu **⋮** in the top-right corner",
      "Open **Save and Share** (sometimes labeled **Cast, Save, and Share**)",
      `Choose **Install Page as App** or **Install ${APP_NAME}**`,
      "Click **Install app** to confirm",
      `Open the **Applications** folder, then drag **${APP_NAME}** to your **Dock** or **Desktop**`,
    ];
  }

  if (isWindowsDevice()) {
    return [
      "Click Chrome or Edge’s menu **⋮** in the top-right corner",
      "Open **Save and Share** (sometimes labeled **Cast, Save, and Share**)",
      `Choose **Install Page as App** or **Install ${APP_NAME}**`,
      "Click **Install app** to confirm",
      `Open the Start menu, find **${APP_NAME}**, then pin it to the taskbar or desktop if you want a shortcut`,
    ];
  }

  return [
    "Click Chrome or Edge’s menu **⋮** in the top-right corner",
    "Open **Save and Share** (sometimes labeled **Cast, Save, and Share**)",
    `Choose **Install Page as App** or **Install ${APP_NAME}**`,
    "Click **Install app** to confirm",
  ];
}
