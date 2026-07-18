"use client";

import { useMemo } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  APP_LANGUAGE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  UNSET_LOCATION_VALUE,
  formatTimeZoneLabel,
  listTimeZones,
  type AppLanguageSetting,
  type DateFormatSetting,
} from "@/features/settings/lib/location-region";
import { useSettingsStore } from "@/features/settings/store/settings-store";

function SelectChevron() {
  return (
    <span className="settings-preferences-field__chevron" aria-hidden>
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function LocationRegionPreferencesCard() {
  const timeZone = useSettingsStore((state) => state.timeZone);
  const dateFormat = useSettingsStore((state) => state.dateFormat);
  const language = useSettingsStore((state) => state.language);
  const setTimeZone = useSettingsStore((state) => state.setTimeZone);
  const setDateFormat = useSettingsStore((state) => state.setDateFormat);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const timeZones = useMemo(() => {
    const zones = listTimeZones();
    if (timeZone && timeZone !== UNSET_LOCATION_VALUE && !zones.includes(timeZone)) {
      return [timeZone, ...zones];
    }
    return zones;
  }, [timeZone]);

  return (
    <GlassPanel className="settings-preferences-card">
      <h3 className="settings-preferences-card__title">Location & Region</h3>
      <p className="settings-preferences-card__description">
        Control how dates and times are shown across DartOS.
      </p>

      <div className="settings-preferences-fields board-theme-accordion">
        <label className="settings-preferences-field board-theme-accordion__section">
          <span className="settings-preferences-field__row board-theme-accordion__header">
            <span className="settings-preferences-field__label board-theme-accordion__label">
              Time zone
            </span>
            <span className="settings-preferences-field__control-wrap">
              <select
                className="settings-preferences-field__control"
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                aria-label="Time zone"
              >
                <option value={UNSET_LOCATION_VALUE}>-</option>
                {timeZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {formatTimeZoneLabel(zone)}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </span>
          </span>
        </label>

        <label className="settings-preferences-field board-theme-accordion__section">
          <span className="settings-preferences-field__row board-theme-accordion__header">
            <span className="settings-preferences-field__label board-theme-accordion__label">
              Date format
            </span>
            <span className="settings-preferences-field__control-wrap">
              <select
                className="settings-preferences-field__control"
                value={dateFormat}
                onChange={(event) =>
                  setDateFormat(event.target.value as DateFormatSetting)
                }
                aria-label="Date format"
              >
                <option value={UNSET_LOCATION_VALUE}>-</option>
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} ({option.example})
                  </option>
                ))}
              </select>
              <SelectChevron />
            </span>
          </span>
        </label>

        <div className="settings-preferences-field board-theme-accordion__section">
          <label className="settings-preferences-field__row board-theme-accordion__header">
            <span className="settings-preferences-field__label board-theme-accordion__label">
              Language
            </span>
            <span className="settings-preferences-field__control-wrap">
              <select
                className="settings-preferences-field__control"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as AppLanguageSetting)
                }
                aria-label="Language"
              >
                <option value={UNSET_LOCATION_VALUE}>-</option>
                {APP_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </span>
          </label>
          <p className="settings-preferences-field__hint">
            Multi-language coming soon
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
