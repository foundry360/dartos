const FULLSCREEN_INTENT_KEY = "dartos-enter-fullscreen";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

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
