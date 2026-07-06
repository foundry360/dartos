const FULLSCREEN_PREFERENCE_KEY = "dartos-fullscreen-preference";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function isIPadDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) {
    return true;
  }

  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isIPhoneDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  return /iPhone|iPod/.test(ua) && !/iPad/.test(ua);
}

/** @deprecated Use isIPadDevice or isIPhoneDevice. */
export function isIOSDevice(): boolean {
  return isIPhoneDevice() || isIPadDevice();
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

export function hasFullscreenSupport(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const element = document.documentElement as FullscreenElement;
  return Boolean(element.requestFullscreen || element.webkitRequestFullscreen);
}

/**
 * iPhone in Safari must use an installed PWA for fullscreen display.
 * Desktop, Android, and iPad browsers can use the Fullscreen API.
 */
export function shouldUseFullscreenAPI(): boolean {
  if (isStandaloneDisplay()) {
    return false;
  }

  if (isIPhoneDevice()) {
    return false;
  }

  return hasFullscreenSupport();
}

export function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") {
    return null;
  }

  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isEffectivelyFullscreen(): boolean {
  if (getFullscreenElement()) {
    return true;
  }

  return isStandaloneDisplay();
}

export function markFullscreenPreference(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(FULLSCREEN_PREFERENCE_KEY, "1");
}

export function wantsFullscreenPreference(): boolean {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  return sessionStorage.getItem(FULLSCREEN_PREFERENCE_KEY) === "1";
}

export function clearFullscreenPreference(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(FULLSCREEN_PREFERENCE_KEY);
}

/** @deprecated Use markFullscreenPreference. */
export function markFullscreenIntent(): void {
  markFullscreenPreference();
}

/** @deprecated Use wantsFullscreenPreference. */
export function consumeFullscreenIntent(): boolean {
  return wantsFullscreenPreference();
}

export async function requestAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  if (isStandaloneDisplay()) {
    return true;
  }

  if (!shouldUseFullscreenAPI()) {
    return false;
  }

  if (getFullscreenElement()) {
    return true;
  }

  const element = document.documentElement as FullscreenElement;

  try {
    if (element.requestFullscreen) {
      try {
        await element.requestFullscreen({ navigationUI: "hide" });
      } catch {
        await element.requestFullscreen();
      }

      const entered = Boolean(getFullscreenElement());
      if (entered) {
        markFullscreenPreference();
      }

      return entered;
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      const entered = Boolean(getFullscreenElement());
      if (entered) {
        markFullscreenPreference();
      }

      return entered;
    }
  } catch {
    return false;
  }

  return false;
}

export async function exitAppFullscreen(userInitiated = false): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }

  if (userInitiated) {
    clearFullscreenPreference();
  }

  if (isStandaloneDisplay() || !shouldUseFullscreenAPI()) {
    return true;
  }

  if (!getFullscreenElement()) {
    return true;
  }

  const doc = document as FullscreenDocument;

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return !getFullscreenElement();
    }

    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return !getFullscreenElement();
    }
  } catch {
    return false;
  }

  return false;
}

export function listenForFullscreenChanges(onChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange);

  return () => {
    document.removeEventListener("fullscreenchange", onChange);
    document.removeEventListener("webkitfullscreenchange", onChange);
  };
}

/** Retry fullscreen on user gestures until it succeeds. */
export function bindFullscreenUntilEntered(): () => void {
  if (isEffectivelyFullscreen() || !shouldUseFullscreenAPI()) {
    return () => {};
  }

  let disposed = false;

  const tryEnter = () => {
    if (disposed || isEffectivelyFullscreen()) {
      cleanup();
      return;
    }

    void requestAppFullscreen().then((entered) => {
      if (entered || isEffectivelyFullscreen()) {
        markFullscreenPreference();
        cleanup();
      }
    });
  };

  const cleanup = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    window.removeEventListener("pointerdown", tryEnter, capture);
    window.removeEventListener("touchstart", tryEnter, capture);
    window.removeEventListener("click", tryEnter, capture);
    window.removeEventListener("keydown", tryEnter, capture);
    stopListening();
  };

  const capture = { capture: true };
  window.addEventListener("pointerdown", tryEnter, capture);
  window.addEventListener("touchstart", tryEnter, capture);
  window.addEventListener("click", tryEnter, capture);
  window.addEventListener("keydown", tryEnter, capture);

  const stopListening = listenForFullscreenChanges(() => {
    if (isEffectivelyFullscreen()) {
      markFullscreenPreference();
      cleanup();
    }
  });

  void requestAppFullscreen().then((entered) => {
    if (entered || isEffectivelyFullscreen()) {
      markFullscreenPreference();
      cleanup();
    }
  });

  return cleanup;
}

let activeGestureCleanup: (() => void) | null = null;

function ensureFullscreenWithGestureFallback(): void {
  if (!shouldUseFullscreenAPI() || isStandaloneDisplay()) {
    return;
  }

  if (!wantsFullscreenPreference()) {
    activeGestureCleanup?.();
    activeGestureCleanup = null;
    return;
  }

  if (isEffectivelyFullscreen()) {
    activeGestureCleanup?.();
    activeGestureCleanup = null;
    return;
  }

  if (activeGestureCleanup) {
    return;
  }

  activeGestureCleanup = bindFullscreenUntilEntered();
  const previousCleanup = activeGestureCleanup;
  activeGestureCleanup = () => {
    previousCleanup();
    if (activeGestureCleanup === previousCleanup) {
      activeGestureCleanup = null;
    }
  };
}

/** Re-enter fullscreen after navigation or accidental browser exit. */
export function maintainAppFullscreen(): () => void {
  if (!shouldUseFullscreenAPI()) {
    return () => {};
  }

  const onFullscreenChange = () => {
    if (isEffectivelyFullscreen()) {
      markFullscreenPreference();
      activeGestureCleanup?.();
      activeGestureCleanup = null;
      return;
    }

    ensureFullscreenWithGestureFallback();
  };

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  ensureFullscreenWithGestureFallback();

  return () => {
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    activeGestureCleanup?.();
    activeGestureCleanup = null;
  };
}

/** Retry fullscreen on the next user gesture when a programmatic request is blocked. */
export function retryFullscreenOnUserGesture(): () => void {
  return bindFullscreenUntilEntered();
}

/** Enter fullscreen as early as possible on app launch (desktop + tablet web). */
export function initAppFullscreenOnLaunch(): void {
  if (isEffectivelyFullscreen()) {
    markFullscreenPreference();
    return;
  }

  if (!shouldUseFullscreenAPI()) {
    return;
  }

  markFullscreenPreference();
}

/** Call after client-side navigation when fullscreen preference is active. */
export function restoreFullscreenAfterNavigation(): void {
  ensureFullscreenWithGestureFallback();
}

/** Call from a click/tap handler (e.g. Start Match) while the user gesture is active. */
export async function enterMatchFullscreen(): Promise<boolean> {
  markFullscreenIntent();
  return requestAppFullscreen();
}

/** Call on the play screen if setup navigation dropped fullscreen before it stuck. */
export function fulfillMatchFullscreenIntent(): () => void {
  if (!wantsFullscreenPreference()) {
    return () => {};
  }

  if (isEffectivelyFullscreen()) {
    return () => {};
  }

  ensureFullscreenWithGestureFallback();
  return () => {};
}

/** @deprecated Use enterMatchFullscreen and await before navigating. */
export function startMatchFullscreen(): void {
  void enterMatchFullscreen();
}
