"use client";

import {
  DEFAULT_HELP_SECTION,
  HELP_SECTIONS,
  type HelpSectionId,
} from "@/features/help/lib/help-sections";
import { HelpSectionIcon } from "@/features/help/components/HelpSectionIcons";
import { cn } from "@/utils/cn";

interface HelpNavProps {
  activeSection: HelpSectionId;
  onSelect: (section: HelpSectionId) => void;
}

export function HelpNav({ activeSection, onSelect }: HelpNavProps) {
  return (
    <nav className="settings-nav" aria-label="Get Started topics">
      <ul className="settings-nav__list">
        {HELP_SECTIONS.map((section) => {
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
                  <HelpSectionIcon section={section.id} />
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

export { DEFAULT_HELP_SECTION };
