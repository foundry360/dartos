const FULLSCREEN_INTENT_KEY = "dartos-enter-fullscreen";

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

      return Boolean(getFullscreenElement());
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return Boolean(getFullscreenElement());
    }
  } catch {
    return false;
  }

  return false;
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
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
      cleanup();
    }
  });

  void requestAppFullscreen().then((entered) => {
    if (entered || isEffectivelyFullscreen()) {
      cleanup();
    }
  });

  return cleanup;
}

/** Retry fullscreen on the next user gesture when a programmatic request is blocked. */
export function retryFullscreenOnUserGesture(): () => void {
  return bindFullscreenUntilEntered();
}

/** Enter fullscreen as early as possible on app launch (desktop + tablet web). */
export function initAppFullscreenOnLaunch(): () => void {
  if (isEffectivelyFullscreen() || !shouldUseFullscreenAPI()) {
    return () => {};
  }

  return bindFullscreenUntilEntered();
}

/** Call from a click/tap handler (e.g. Start Match) while the user gesture is active. */
export async function enterMatchFullscreen(): Promise<boolean> {
  markFullscreenIntent();
  return requestAppFullscreen();
}

/** Call on the play screen if setup navigation happened before fullscreen stuck. */
export function fulfillMatchFullscreenIntent(): () => void {
  if (!consumeFullscreenIntent()) {
    return () => {};
  }

  if (getFullscreenElement() || isStandaloneDisplay()) {
    return () => {};
  }

  return bindFullscreenUntilEntered();
}

/** @deprecated Use enterMatchFullscreen and await before navigating. */
export function startMatchFullscreen(): void {
  void enterMatchFullscreen();
}
