"use client";

import {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";
import { SettingsSectionIcon } from "@/features/settings/components/SettingsSectionIcons";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { cn } from "@/utils/cn";

interface SettingsNavProps {
  activeSection: SettingsSectionId;
  onSelect: (section: SettingsSectionId) => void;
}

export function SettingsNav({ activeSection, onSelect }: SettingsNavProps) {
  const { allowed: canManageLeagues } = useLeagueManagementAccess();
  const sections = canManageLeagues
    ? SETTINGS_SECTIONS.filter((section) => section.id !== "players")
    : SETTINGS_SECTIONS;

  return (
    <nav className="settings-nav" aria-label="Settings sections">
      <ul className="settings-nav__list">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <li key={section.id}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelect(section.id)}
                className={cn("settings-nav__item", isActive && "settings-nav__item--active")}
              >
                <span className="settings-nav__icon" aria-hidden>
                  <SettingsSectionIcon section={section.id} />
                </span>
                <span className="settings-nav__label">{section.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { DEFAULT_SETTINGS_SECTION };
