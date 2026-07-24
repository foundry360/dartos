export type DeviceNotch = "island" | "none";

export interface DevicePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  /** Outer bezel corner radius in CSS px (pre-scale). */
  radius: number;
  notch: DeviceNotch;
  kind: "phone" | "tablet";
}

/** CSS viewport sizes matching common Chrome DevTools presets. */
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: "iphone-14-pro",
    label: "iPhone 14 Pro",
    width: 393,
    height: 852,
    radius: 55,
    notch: "island",
    kind: "phone",
  },
  {
    id: "iphone-se",
    label: "iPhone SE",
    width: 375,
    height: 667,
    radius: 40,
    notch: "none",
    kind: "phone",
  },
  {
    id: "iphone-15-pro-max",
    label: "iPhone 15 Pro Max",
    width: 430,
    height: 932,
    radius: 55,
    notch: "island",
    kind: "phone",
  },
  {
    id: "ipad-mini",
    label: "iPad Mini",
    width: 768,
    height: 1024,
    radius: 18,
    notch: "none",
    kind: "tablet",
  },
  {
    id: "ipad-air",
    label: "iPad Air",
    width: 820,
    height: 1180,
    radius: 18,
    notch: "none",
    kind: "tablet",
  },
];

export const DEFAULT_DEVICE_ID = "iphone-14-pro";
export const DEFAULT_PREVIEW_PATH = "/player";

export function getDevicePreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find((device) => device.id === id) ?? DEVICE_PRESETS[0]!;
}

export function normalizePreviewPath(value: string): string {
  const trimmed = value.trim() || DEFAULT_PREVIEW_PATH;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return DEFAULT_PREVIEW_PATH;
  }
  return trimmed;
}
