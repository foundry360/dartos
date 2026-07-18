export type DateFormatId = "mdy" | "dmy" | "ymd";
export type AppLanguageId = "en";

/** Unset placeholder shown as "-" in Location & Region selects. */
export const UNSET_LOCATION_VALUE = "";

export interface DateFormatOption {
  id: DateFormatId;
  label: string;
  example: string;
}

export interface AppLanguageOption {
  id: AppLanguageId;
  label: string;
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { id: "mdy", label: "MM/DD/YYYY", example: "07/17/2026" },
  { id: "dmy", label: "DD/MM/YYYY", example: "17/07/2026" },
  { id: "ymd", label: "YYYY-MM-DD", example: "2026-07-17" },
];

export const APP_LANGUAGE_OPTIONS: AppLanguageOption[] = [
  { id: "en", label: "English" },
];

export type DateFormatSetting = DateFormatId | typeof UNSET_LOCATION_VALUE;
export type AppLanguageSetting = AppLanguageId | typeof UNSET_LOCATION_VALUE;

export const DEFAULT_DATE_FORMAT: DateFormatSetting = UNSET_LOCATION_VALUE;
export const DEFAULT_APP_LANGUAGE: AppLanguageSetting = UNSET_LOCATION_VALUE;
export const DEFAULT_TIME_ZONE = UNSET_LOCATION_VALUE;

const FALLBACK_TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Warsaw",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export function listTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return (Intl as typeof Intl & { supportedValuesOf(key: "timeZone"): string[] })
        .supportedValuesOf("timeZone");
    }
  } catch {
    // ignore
  }

  return [...FALLBACK_TIME_ZONES];
}

export function formatTimeZoneLabel(timeZone: string): string {
  return timeZone.replace(/_/g, " ");
}

export function isDateFormatId(value: string): value is DateFormatId {
  return DATE_FORMAT_OPTIONS.some((option) => option.id === value);
}

export function isAppLanguageId(value: string): value is AppLanguageId {
  return APP_LANGUAGE_OPTIONS.some((option) => option.id === value);
}

export function isDateFormatSetting(value: string): value is DateFormatSetting {
  return value === UNSET_LOCATION_VALUE || isDateFormatId(value);
}

export function isAppLanguageSetting(value: string): value is AppLanguageSetting {
  return value === UNSET_LOCATION_VALUE || isAppLanguageId(value);
}
