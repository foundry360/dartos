"use client";

import { useMemo, useState } from "react";
import {
  BOARD_THEMES,
  groupBoardThemesByCategory,
  type BoardTheme,
  type BoardThemeCategoryId,
} from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { cn } from "@/utils/cn";

interface BoardThemePickerProps {
  embedded?: boolean;
}

function AccordionChevron({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "board-theme-accordion__chevron-wrap",
        open && "board-theme-accordion__chevron-wrap--open",
      )}
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

function BoardThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: BoardTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "board-theme-card rounded-2xl border bg-surface-elevated text-left transition-colors",
        selected
          ? "border-accent ring-2 ring-accent/35"
          : "border-border hover:border-border/80 hover:bg-surface-hover",
      )}
    >
      <div className="board-theme-card__header">
        <div className="min-w-0">
          <p className="board-theme-card__name">{theme.name}</p>
          <p className="board-theme-card__description">{theme.description}</p>
        </div>
        {selected ? (
          <span className="board-theme-card__badge shrink-0">
            Active
          </span>
        ) : null}
      </div>

      <div className="board-theme-card__swatches" aria-hidden>
        <div className="board-theme-card__swatch-row">
          <span
            className="flex-1"
            style={{ backgroundColor: theme.colors.boardBase }}
            title="Board background"
          />
          <span
            className="flex-1"
            style={{ backgroundColor: theme.colors.segmentPrimary }}
            title="Segment color 1"
          />
          <span
            className="flex-1"
            style={{ backgroundColor: theme.colors.segmentSecondary }}
            title="Segment color 2"
          />
          <span
            className="flex-1"
            style={{
              backgroundColor: theme.colors.segmentMatchedScoringRings
                ? (theme.colors.scoringRingOnSegmentPrimary ?? "#ffffff")
                : theme.colors.triple,
            }}
            title="Treble ring"
          />
          <span
            className="flex-1"
            style={{
              backgroundColor: theme.colors.segmentMatchedScoringRings
                ? (theme.colors.scoringRingOnSegmentSecondary ?? theme.colors.triple)
                : theme.colors.alternateScoringRings && theme.colors.scoringRingAccent
                  ? theme.colors.scoringRingAccent
                  : theme.colors.double,
            }}
            title={
              theme.colors.segmentMatchedScoringRings
                ? "Scoring ring on base wedges"
                : theme.colors.alternateScoringRings && theme.colors.scoringRingAccent
                  ? "Scoring ring accent"
                  : "Double ring"
            }
          />
        </div>
      </div>
    </button>
  );
}

export function BoardThemePicker({ embedded = false }: BoardThemePickerProps) {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const setBoardThemeId = useSettingsStore((state) => state.setBoardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);

  const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
  const groupedThemes = useMemo(
    () => groupBoardThemesByCategory(availableThemes),
    [availableThemes],
  );

  const [openCategoryId, setOpenCategoryId] = useState<BoardThemeCategoryId | null>("dartos");

  const toggleCategory = (categoryId: BoardThemeCategoryId) => {
    setOpenCategoryId((current) => (current === categoryId ? null : categoryId));
  };

  return (
    <div className={embedded ? "space-y-3" : "space-y-3 px-4"}>
      {!embedded ? (
        <div>
          <h2 className="settings-panel__subheading text-2xl font-bold">Board theme</h2>
          <p className="settings-panel__subdescription">
            Choose colors for the dartboard background, segments, and scoring rings.
          </p>
        </div>
      ) : (
        <p className="settings-panel__description">
          Choose colors for the dartboard background, segments, and scoring rings.
        </p>
      )}

      <div className="board-theme-accordion" role="radiogroup" aria-label="Board theme">
        {groupedThemes.map(({ category, themes: categoryThemes }) => {
          const isOpen = openCategoryId === category.id;

          return (
            <section key={category.id} className="board-theme-accordion__section">
              <button
                type="button"
                className="board-theme-accordion__header"
                aria-expanded={isOpen}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="board-theme-accordion__label">
                  {category.label} ({categoryThemes.length})
                </span>
                <AccordionChevron open={isOpen} />
              </button>

              {isOpen ? (
                <div className="board-theme-accordion__panel">
                  {categoryThemes.map((theme) => (
                    <BoardThemeCard
                      key={theme.id}
                      theme={theme}
                      selected={boardThemeId === theme.id}
                      onSelect={() => setBoardThemeId(theme.id)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
