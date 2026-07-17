"use client";

import { useEffect, useMemo, useState } from "react";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { StepperControl } from "@/components/ui/StepperControl";
import { TouchButton } from "@/components/ui/TouchButton";
import { formatLeagueGameFormatLabel } from "@/features/leagues/lib/league-formats";
import {
  formatLeagueRulesSummaryRows,
  getDefaultLeagueRules,
  getLeagueRuleFieldGroups,
  normalizeLeagueRules,
  validateLeagueRules,
  type LeagueGameRules,
  type MixedRotationGame,
} from "@/features/leagues/lib/league-game-rules";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  updateLeagueRules,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";
import { cn } from "@/utils/cn";

interface LeagueDetailRulesProps {
  leagueEntry: LeagueWithVenue;
  onLeagueUpdated: (entry: LeagueWithVenue) => void;
}

function readPathValue(
  source: unknown,
  path: string,
): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function readFieldValue(
  rules: LeagueGameRules,
  key: string,
): string | number | string[] | null {
  const value = readPathValue(rules, key);

  if (value == null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return null;
}

const NIGHT_NUMBER_KEYS = new Set([
  "matchesPerPlayer",
  "teamSize",
  "singlesCount",
  "doublesCount",
]);

function patchRules(
  rules: LeagueGameRules,
  key: string,
  value: string | number | string[] | null,
): LeagueGameRules {
  const nextValue =
    value === ""
      ? null
      : NIGHT_NUMBER_KEYS.has(key) &&
          (typeof value === "string" || typeof value === "number")
        ? (() => {
            const parsed = typeof value === "number" ? value : Number(value);
            return Number.isFinite(parsed) ? parsed : null;
          })()
        : value;

  if (!key.includes(".")) {
    return {
      ...rules,
      [key]: nextValue,
    } as LeagueGameRules;
  }

  const [rootKey, ...rest] = key.split(".");
  if (!rootKey || rest.length === 0) {
    return rules;
  }

  const rootValue = (rules as unknown as Record<string, unknown>)[rootKey];
  const rootObject =
    rootValue != null && typeof rootValue === "object" && !Array.isArray(rootValue)
      ? { ...(rootValue as Record<string, unknown>) }
      : {};

  let cursor: Record<string, unknown> = rootObject;
  for (let index = 0; index < rest.length - 1; index += 1) {
    const segment = rest[index]!;
    const child = cursor[segment];
    const nextChild =
      child != null && typeof child === "object" && !Array.isArray(child)
        ? { ...(child as Record<string, unknown>) }
        : {};
    cursor[segment] = nextChild;
    cursor = nextChild;
  }
  cursor[rest[rest.length - 1]!] = nextValue;

  return {
    ...rules,
    [rootKey]: rootObject,
  } as LeagueGameRules;
}

function toggleOrderedGame(
  games: MixedRotationGame[],
  value: MixedRotationGame,
): MixedRotationGame[] {
  if (games.includes(value)) {
    return games.filter((game) => game !== value);
  }
  return [...games, value];
}

function moveOrderedGame(
  games: MixedRotationGame[],
  index: number,
  direction: -1 | 1,
): MixedRotationGame[] {
  const target = index + direction;
  if (target < 0 || target >= games.length) {
    return games;
  }
  const next = [...games];
  const [item] = next.splice(index, 1);
  if (!item) {
    return games;
  }
  next.splice(target, 0, item);
  return next;
}

export function LeagueDetailRules({
  leagueEntry,
  onLeagueUpdated,
}: LeagueDetailRulesProps) {
  const { league } = leagueEntry;
  const gameFormat = league.game_format;
  const leagueFormat = league.format;
  const gameFormatLabel = formatLeagueGameFormatLabel(gameFormat);
  const [draft, setDraft] = useState<LeagueGameRules | null>(() => {
    if (league.rules == null) {
      return getDefaultLeagueRules(gameFormat);
    }
    return normalizeLeagueRules(league.rules, gameFormat);
  });
  const fieldGroups = useMemo(
    () => getLeagueRuleFieldGroups(gameFormat, leagueFormat, draft),
    [draft, gameFormat, leagueFormat],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (league.rules == null) {
      setDraft(getDefaultLeagueRules(league.game_format));
    } else {
      setDraft(normalizeLeagueRules(league.rules, league.game_format));
    }
    setError(null);
    // Intentionally omit `league.rules`: parent refetches often create a new
    // object reference with the same content and would wipe in-progress edits.
    // Saves bump `league.updated_at`, which reloads the draft correctly.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [league.id, league.game_format, league.updated_at]);

  useEffect(() => {
    setSaved(false);
  }, [league.id, league.game_format]);

  function markDirty() {
    setSaved(false);
  }

  const previewRows = useMemo(() => {
    if (!draft) {
      return [];
    }

    return formatLeagueRulesSummaryRows(draft, gameFormatLabel, leagueFormat);
  }, [draft, gameFormatLabel, leagueFormat]);

  async function handleSave() {
    if (!draft) {
      return;
    }

    const normalized = normalizeLeagueRules(draft, gameFormat);
    if (!normalized) {
      setError("Unable to normalize game rules for this format.");
      return;
    }

    const validationError = validateLeagueRules(normalized, leagueFormat);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (league.id.startsWith("sample-") || !isSupabaseConfigured()) {
        onLeagueUpdated({
          ...leagueEntry,
          league: {
            ...league,
            rules: normalized as unknown as LeagueWithVenue["league"]["rules"],
            updated_at: new Date().toISOString(),
          },
        });
        setDraft(normalized);
        setSaved(true);
        return;
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const updated = await updateLeagueRules(supabase, league.id, normalized);
      onLeagueUpdated(updated);
      setDraft(normalized);
      setSaved(true);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to save game rules.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    const defaults = getDefaultLeagueRules(gameFormat);
    setDraft(defaults);
    setError(null);
    markDirty();
  }

  if (!gameFormat || !draft || fieldGroups.length === 0) {
    return (
      <div className="league-workspace league-workspace--single">
        <section className="league-detail-card">
          <h2 className="league-detail-card__title">Game Rules</h2>
          <p className="league-detail-card__copy">
            Set a Game Format on the league first (Overview → Edit). Rules fields
            are based on the selected format and apply to every scheduled match.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="league-workspace league-rules">
      <div
        className="league-workspace__main"
        onFocusCapture={markDirty}
      >
        {fieldGroups.map((group) => (
          <section key={group.id} className="league-detail-card">
            <div className="league-detail-card__header">
              <div>
                <h2 className="league-detail-card__title">{group.title}</h2>
                {group.description ? (
                  <p className="league-rules__group-desc">{group.description}</p>
                ) : null}
              </div>
            </div>

            <div className="league-rules__fields">
              {group.fields.map((field) => {
                if (field.type === "readonly") {
                  return (
                    <div key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <p className="league-rules__readonly">{field.displayValue}</p>
                    </div>
                  );
                }

                if (field.type === "number") {
                  const rawValue = readFieldValue(draft, field.key);
                  const numericValue =
                    typeof rawValue === "number" ? rawValue : null;
                  const min = field.min ?? 0;
                  const max = field.max ?? 9999;
                  const step = field.step ?? 1;
                  return (
                    <div key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <StepperControl
                        className="league-rules__stepper"
                        value={numericValue}
                        min={min}
                        max={max}
                        step={step}
                        onChange={(next) => {
                          setDraft(patchRules(draft, field.key, next));
                          markDirty();
                        }}
                      />
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  const value = String(readFieldValue(draft, field.key) ?? "");
                  return (
                    <label
                      key={field.key}
                      className="league-rules__field league-rules__field--wide"
                    >
                      <span className="league-rules__label">{field.label}</span>
                      <textarea
                        className="league-rules__textarea"
                        rows={field.rows ?? 8}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(event) => {
                          setDraft(
                            patchRules(draft, field.key, event.target.value),
                          );
                          markDirty();
                        }}
                      />
                    </label>
                  );
                }

                if (
                  field.type === "multiselect" ||
                  field.type === "ordered-multiselect"
                ) {
                  const selected = readFieldValue(draft, field.key);
                  const selectedGames = (
                    Array.isArray(selected) ? selected : []
                  ).filter((entry): entry is MixedRotationGame =>
                    field.options.some((option) => option.value === entry),
                  );
                  const selectedSet = new Set(selectedGames);
                  const isOrdered = field.type === "ordered-multiselect";

                  return (
                    <div
                      key={field.key}
                      className="league-rules__field league-rules__field--wide"
                    >
                      <span className="league-rules__label">{field.label}</span>
                      <div className="league-rules__chips" role="group">
                        {field.options.map((option) => {
                          const active = selectedSet.has(
                            option.value as MixedRotationGame,
                          );
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={cn(
                                "league-rules__chip",
                                active && "is-active",
                              )}
                              aria-pressed={active}
                              onClick={() => {
                                const next = isOrdered
                                  ? toggleOrderedGame(
                                      selectedGames,
                                      option.value as MixedRotationGame,
                                    )
                                  : (() => {
                                      const set = new Set(selectedGames);
                                      if (set.has(option.value as MixedRotationGame)) {
                                        set.delete(option.value as MixedRotationGame);
                                      } else {
                                        set.add(option.value as MixedRotationGame);
                                      }
                                      return [...set] as MixedRotationGame[];
                                    })();
                                setDraft(patchRules(draft, field.key, next));
                                markDirty();
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {isOrdered && selectedGames.length > 0 ? (
                        <div className="league-rules__order">
                          <span className="league-rules__order-label">
                            {field.orderLabel ?? "Order"}
                          </span>
                          <ol className="league-rules__order-list">
                            {selectedGames.map((game, index) => {
                              const label =
                                field.options.find(
                                  (option) => option.value === game,
                                )?.label ?? game;
                              return (
                                <li
                                  key={`${game}-${index}`}
                                  className="league-rules__order-item"
                                >
                                  <span className="league-rules__order-index">
                                    {index + 1}
                                  </span>
                                  <span className="league-rules__order-name">
                                    {label}
                                  </span>
                                  <div className="league-rules__order-actions">
                                    <button
                                      type="button"
                                      className="league-rules__order-move"
                                      disabled={index === 0}
                                      aria-label={`Move ${label} up`}
                                      onClick={() => {
                                        setDraft(
                                          patchRules(
                                            draft,
                                            field.key,
                                            moveOrderedGame(
                                              selectedGames,
                                              index,
                                              -1,
                                            ),
                                          ),
                                        );
                                        markDirty();
                                      }}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      className="league-rules__order-move"
                                      disabled={
                                        index === selectedGames.length - 1
                                      }
                                      aria-label={`Move ${label} down`}
                                      onClick={() => {
                                        setDraft(
                                          patchRules(
                                            draft,
                                            field.key,
                                            moveOrderedGame(
                                              selectedGames,
                                              index,
                                              1,
                                            ),
                                          ),
                                        );
                                        markDirty();
                                      }}
                                    >
                                      ↓
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                const raw = readFieldValue(draft, field.key);
                const value = raw == null ? "" : String(raw);
                return (
                  <div key={field.key} className="league-rules__field">
                    <OptionPickerField
                      label={field.label}
                      value={value}
                      options={field.options}
                      placeholder="-"
                      allowClear={false}
                      onChange={(next) => {
                        setDraft(patchRules(draft, field.key, next || null));
                        markDirty();
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="league-workspace__side">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Preview</h2>
          </div>
          <dl className="league-info">
            {previewRows.map((row) => (
              <div key={row.label} className="league-info__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {error ? <p className="league-rules__error">{error}</p> : null}

        <div className="league-rules__actions">
          <TouchButton
            type="button"
            variant="secondary"
            onClick={handleResetDefaults}
            disabled={saving}
          >
            Clear
          </TouchButton>
          <TouchButton
            type="button"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving || saved}
          >
            {saving ? "Saving…" : saved ? "Saved" : "Save Game Rules"}
          </TouchButton>
        </div>
      </aside>
    </div>
  );
}
