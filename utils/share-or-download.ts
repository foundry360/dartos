export type ShareOrDownloadResult =
  | "shared"
  | "downloaded"
  | "saved"
  | "cancelled";

function triggerAnchorDownload(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener";
  // Keep out of the document — appending can break blob downloads in some Chromium builds.
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function openInNewTab(file: File) {
  const url = URL.createObjectURL(file);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return Boolean(opened);
}

export function canShareFiles(file: File): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.canShare !== "function" ||
    typeof navigator.share !== "function"
  ) {
    return false;
  }

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function canUseSaveFilePicker(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

async function saveWithFilePicker(file: File): Promise<boolean> {
  const picker = (
    window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string;
        types?: Array<{
          description?: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<FileSystemFileHandle>;
    }
  ).showSaveFilePicker;

  if (!picker) {
    return false;
  }

  const handle = await picker({
    suggestedName: file.name,
    types: [
      {
        description: "PDF",
        accept: { "application/pdf": [".pdf"] },
      },
    ],
  });
  const writable = await handle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
  return true;
}

/**
 * Chrome desktop: native Save dialog via showSaveFilePicker.
 * iPad/Safari: Share sheet when file sharing is supported.
 * Fallback: anchor download, then open PDF in a new tab.
 */
export async function shareOrDownloadFile(
  file: File,
  options?: {
    title?: string;
    text?: string;
  },
): Promise<ShareOrDownloadResult> {
  if (canUseSaveFilePicker()) {
    try {
      await saveWithFilePicker(file);
      return "saved";
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return "cancelled";
      }
      // Fall through to share/download if the picker is unavailable/blocked.
    }
  }

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title: options?.title,
        text: options?.text,
      });
      return "shared";
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return "cancelled";
      }
      // Fall through.
    }
  }

  try {
    triggerAnchorDownload(file);
    return "downloaded";
  } catch {
    if (openInNewTab(file)) {
      return "downloaded";
    }
    throw new Error("Unable to export file in this browser.");
  }
}

/** @deprecated Prefer shareOrDownloadFile — kept for callers that need a sync path. */
export function downloadFile(file: File) {
  triggerAnchorDownload(file);
}
