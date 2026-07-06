"use client";

import { BOARD_THEMES } from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { cn } from "@/utils/cn";

interface BoardThemePickerProps {
  embedded?: boolean;
}

export function BoardThemePicker({ embedded = false }: BoardThemePickerProps) {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const setBoardThemeId = useSettingsStore((state) => state.setBoardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);

  const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;

  return (
    <div className={embedded ? "space-y-3" : "space-y-3 px-4"}>
      {!embedded ? (
        <div>
          <h2 className="text-lg">Board theme</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose colors for the dartboard background, segments, and scoring rings.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose colors for the dartboard background, segments, and scoring rings.
        </p>
      )}

      <div
        role="radiogroup"
        aria-label="Board theme"
        className="grid grid-cols-1 gap-3 xl:grid-cols-2"
      >
        {availableThemes.map((theme) => {
          const selected = boardThemeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setBoardThemeId(theme.id)}
              className={cn(
                "rounded-2xl border bg-surface-elevated p-4 text-left transition-colors",
                selected
                  ? "border-accent ring-2 ring-accent/35"
                  : "border-border hover:border-border/80 hover:bg-surface-hover",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{theme.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{theme.description}</p>
                </div>
                {selected ? (
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    Active
                  </span>
                ) : null}
              </div>

              <div
                className="mt-4 overflow-hidden rounded-xl border border-border/60"
                aria-hidden
              >
                <div className="flex h-8">
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
                        ? "#ffffff"
                        : theme.colors.triple,
                    }}
                    title="Treble ring"
                  />
                  <span
                    className="flex-1"
                    style={{
                      backgroundColor:
                        theme.colors.segmentMatchedScoringRings
                          ? theme.colors.segmentSecondary
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
        })}
      </div>
    </div>
  );
}
