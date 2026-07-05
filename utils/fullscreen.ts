const FULLSCREEN_INTENT_KEY = "dartos-enter-fullscreen";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

/** iPadOS 13+ may report as MacIntel with touch. */
export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadDesktopUA =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isClassicIOS || isIPadDesktopUA;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

/**
 * Safari/iPadOS shows a system "X" exit control when the Fullscreen API is used.
 * That overlay cannot be hidden — use the installed PWA instead.
 */
export function shouldUseFullscreenAPI(): boolean {
  if (isIOSDevice()) {
    return false;
  }

  return true;
}

export function isEffectivelyFullscreen(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  if (document.fullscreenElement) {
    return true;
  }

  return isStandaloneDisplay();
}

export function markFullscreenIntent(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(FULLSCREEN_INTENT_KEY, "1");
}

export function consumeFullscreenIntent(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  const shouldEnter = sessionStorage.getItem(FULLSCREEN_INTENT_KEY) === "1";
  sessionStorage.removeItem(FULLSCREEN_INTENT_KEY);
  return shouldEnter;
}

export async function requestAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  if (!shouldUseFullscreenAPI()) {
    return isStandaloneDisplay();
  }

  if (document.fullscreenElement) {
    return true;
  }

  const element = document.documentElement as FullscreenElement;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return Boolean(document.fullscreenElement);
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
};

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  if (!shouldUseFullscreenAPI()) {
    return true;
  }

  if (!document.fullscreenElement) {
    return true;
  }

  const doc = document as FullscreenDocument;

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return !document.fullscreenElement;
    }

    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function startMatchFullscreen(): void {
  markFullscreenIntent();
  void requestAppFullscreen();
}
